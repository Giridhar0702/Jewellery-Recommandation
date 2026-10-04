from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import os
import shutil
import json
import numpy as np
import faiss
from PIL import Image
from typing import List
from contextlib import asynccontextmanager

# --- DEBUG LOGGING ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STARTUP_LOG = os.path.join(PROJECT_ROOT, "backend_startup.log")

def log_startup(msg):
    try:
        with open(STARTUP_LOG, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception as e:
        print(f"Logging failed: {e}")
    print(msg)

try:
    with open(STARTUP_LOG, "w") as f:
        f.write("Initializing backend...\n")
except Exception as e:
    print(f"Could not open log file: {e}")

log_startup(f"CWD: {os.getcwd()}")
log_startup(f"Executable: {sys.executable}")
log_startup(f"Path: {sys.path}")

# Add parent directory to path to import existing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.schemas import (
    SearchResult, TextSearchRequest, TextSearchResponse,
    ChatSearchRequest, ChatMessageResponse, ChatResultsResponse,
)
from backend.config import DATA_DIR, INDEX_DIR
from backend.models.clip import get_image_embedding
from backend.search import image_search, sketch_search
from backend.utils.captioning import generate_caption
from backend.utils.sketch_utils import photo_to_sketch_database
from backend.services.chat_service import process_message
from tqdm import tqdm
import time as _time

# --- LIFESPAN MANAGER (Replaces initialize_system) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting System Initialization...")
    
    METADATA_JSON = os.path.join(INDEX_DIR, "metadata_with_captions.json")
    
    # 1. LOAD / BUILD METADATA
    if os.path.exists(METADATA_JSON):
        with open(METADATA_JSON, 'r') as f:
            existing_meta = json.load(f)
    else:
        existing_meta = {}

    new_meta = {}
    
    # Only scan if data directory exists
    if os.path.exists(DATA_DIR):
        for category in os.listdir(DATA_DIR):
            cat_path = os.path.join(DATA_DIR, category)
            if not os.path.isdir(cat_path): continue
            
            for img_name in os.listdir(cat_path):
                if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    full_path = os.path.join(cat_path, img_name)
                    
                    if img_name in existing_meta:
                        caption = existing_meta[img_name]['caption']
                    else:
                        try:
                            img = Image.open(full_path).convert("RGB")
                            caption = generate_caption(img, category_name=category)
                        except:
                            caption = f"a {category} made of gold or silver"
                    
                    new_meta[img_name] = {
                        "image_path": full_path, 
                        "category": category, 
                        "id": img_name,
                        "caption": caption
                    }

        # Save metadata if changed
        if new_meta != existing_meta:
            print("Updates detected (paths or content). Saving new metadata...")
            with open(METADATA_JSON, 'w') as f:
                json.dump(new_meta, f, indent=4)
        
        # 2. BUILD VISUAL INDEX
        img_idx_path = os.path.join(INDEX_DIR, "faiss_image.index")
        meta_npy_path = os.path.join(INDEX_DIR, "metadata.npy")
        
        # Force rebuild if metadata changed or index missing
        should_rebuild_index = False
        if not os.path.exists(img_idx_path):
             should_rebuild_index = True
        elif new_meta != existing_meta:
             should_rebuild_index = True

        meta_list = list(new_meta.values())
             
        if should_rebuild_index:
            print("Building Visual Index...")
            embeddings = []
            
            batch_size = 32
            
            print(f"Processing {len(meta_list)} images in batches of {batch_size}...")
            
            for i in tqdm(range(0, len(meta_list), batch_size)):
                batch_items = meta_list[i:i+batch_size]
                current_batch_imgs = []
                for item in batch_items:
                    try:
                        img = Image.open(item['image_path']).convert("RGB")
                        current_batch_imgs.append(img)
                    except Exception as e:
                        print(f"Error loading {item['image_path']}: {e}")
                        # Black placeholder
                        current_batch_imgs.append(Image.new("RGB", (224, 224)))
                
                if current_batch_imgs:
                    batch_embs = get_image_embedding(current_batch_imgs)
                    embeddings.append(batch_embs)
            
            if embeddings:
                embeddings = np.vstack(embeddings).astype('float32')
                faiss.normalize_L2(embeddings)
                index = faiss.IndexFlatIP(embeddings.shape[1])
                index.add(embeddings)
                faiss.write_index(index, img_idx_path)
                np.save(meta_npy_path, meta_list)
        
        # 3. BUILD SKETCH INDEX
        sketch_idx_path = os.path.join(INDEX_DIR, "faiss_sketch.index")
        
        if not os.path.exists(sketch_idx_path) or should_rebuild_index:
            print("🎨 Building Artistic Sketch Index (Batched)...")
            embeddings = []
            
            sketch_batch_imgs = []
            
            for i, item in enumerate(tqdm(meta_list)):
                try:
                    pil_sketch = photo_to_sketch_database(item['image_path'])
                    if pil_sketch:
                         sketch_batch_imgs.append(pil_sketch)
                    else:
                         sketch_batch_imgs.append(Image.new("RGB", (224, 224)))
                except:
                     sketch_batch_imgs.append(Image.new("RGB", (224, 224)))

                if len(sketch_batch_imgs) >= 32:
                    embeddings.append(get_image_embedding(sketch_batch_imgs))
                    sketch_batch_imgs = []
            
            if sketch_batch_imgs:
                 embeddings.append(get_image_embedding(sketch_batch_imgs))

            if len(embeddings) > 0:
                embeddings = np.vstack(embeddings).astype('float32')
                faiss.normalize_L2(embeddings)
                index = faiss.IndexFlatIP(embeddings.shape[1])
                index.add(embeddings)
                faiss.write_index(index, sketch_idx_path)

    # Load indices into memory
    image_search.load_index()
    sketch_search.load_sketch_index(image_search.metadata)
    
    print("✅ System Ready")
    yield
    print("🛑 Shutting down...")


app = FastAPI(title="Jewellery Retrieval API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (images) so frontend can display them
os.makedirs(DATA_DIR, exist_ok=True)
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")


def _enrich_image_url(raw_path: str) -> str:
    """Convert an absolute image path to a frontend-friendly URL."""
    clean_data_dir = DATA_DIR.replace("\\", "/")
    clean_img_path = raw_path.replace("\\", "/")
    if clean_img_path.startswith(clean_data_dir):
        rel_path = clean_img_path[len(clean_data_dir):].strip("/")
    elif "data/images" in clean_img_path:
        rel_path = clean_img_path.split("data/images")[-1].strip("/")
    else:
        rel_path = os.path.basename(clean_img_path)
    return f"http://localhost:8000/data/{rel_path}?t={int(_time.time())}"


@app.post("/search/text", response_model=TextSearchResponse)
async def search_by_text(req: TextSearchRequest):
    try:
        print(f"🔎 SEARCH REQ: '{req.query}'")
        
        raw_start = image_search.search_by_text(req.query, top_k=req.top_k)
        
        needs_refinement = False
       
        final_query = None
        results_to_use = raw_start
        
        if needs_refinement:
             pass
        else:
            print("🚀 Raw search used (Refinement disabled).")
            
        # Enrich with valid image url for frontend
        results = []
        clean_data_dir = DATA_DIR.replace("\\", "/")
        
        for r in results_to_use:
            clean_img_path = r['image_path'].replace("\\", "/")
            
            if clean_img_path.startswith(clean_data_dir):
                 rel_path = clean_img_path[len(clean_data_dir):].strip("/")
            else:
                 if "data/images" in clean_img_path:
                     rel_path = clean_img_path.split("data/images")[-1].strip("/")
                 else:
                     rel_path = os.path.basename(clean_img_path)

            import time
            r['image_path'] = f"http://localhost:8000/data/{rel_path}?t={int(time.time())}"
            results.append(r)
        
        print(f"📤 RETURNING {len(results)} RESULTS")
            
        return TextSearchResponse(
            query=req.query,
            refined_query=final_query, 
            results=results[:req.top_k]
        )
    except Exception as e:
        print(f"❌ CRITICAL SEARCH ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/debug/check")
async def debug_check():
    try:
        status = {
            "status": "ok",
            "data_dir_exists": os.path.exists(DATA_DIR),
            "data_dir": DATA_DIR,
            "models": {
                "clip": "loaded" if image_search.index else "not loaded",
                "blip": "loaded" if "blip_model" in globals() and globals()["blip_model"] else "lazy-loaded",
                "sketch_index": "loaded" if sketch_search.sketch_index else "not loaded",
                "image_index": "loaded" if image_search.index else "not loaded"
            }
        }
        if os.path.exists(DATA_DIR):
             status["content_count"] = len(os.listdir(DATA_DIR))
        return status
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/search/image", response_model=List[SearchResult])
async def search_by_image(file: UploadFile = File(...)):
    try:
        img = Image.open(file.file).convert("RGB")
        res = image_search.search_by_image(img)
        
        results = []
        for r in res[:30]:
            clean_data_dir = DATA_DIR.replace("\\", "/")
            clean_img_path = r['image_path'].replace("\\", "/")
            if clean_img_path.startswith(clean_data_dir):
                 rel_path = clean_img_path[len(clean_data_dir):].strip("/")
            else:
                 if "data/images" in clean_img_path:
                     rel_path = clean_img_path.split("data/images")[-1].strip("/")
                 else:
                     rel_path = os.path.basename(clean_img_path)
            
            import time
            r['image_path'] = f"http://localhost:8000/data/{rel_path}?t={int(time.time())}"
            results.append(r)
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/sketch", response_model=List[SearchResult])
async def search_by_sketch(file: UploadFile = File(...)):
    try:
        print(f"🎨 SKETCH: Received upload ({file.filename})")
        temp_path = "temp_sketch_upload.jpg"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print("🎨 SKETCH: File saved, starting visual search...")
        res_visual, interpretation = sketch_search.search_by_sketch(temp_path, top_k=20)
        print(f"🎨 SKETCH: Visual search done. Interpretation: '{interpretation}'")
        
        valid_cats = []
        if "ring" in interpretation.lower(): valid_cats.append("ring")
        if "necklace" in interpretation.lower(): valid_cats.append("necklace")
        
        if valid_cats:
            res_visual = [r for r in res_visual if r['category'] in valid_cats]

        print("🎨 SKETCH: Processing results...")
        final = []
        seen = set()
        
        for r in res_visual:
            if r['id'] not in seen:
                clean_data_dir = DATA_DIR.replace("\\", "/")
                clean_img_path = r['image_path'].replace("\\", "/")
                if clean_img_path.startswith(clean_data_dir):
                     rel_path = clean_img_path[len(clean_data_dir):].strip("/")
                else:
                     if "data/images" in clean_img_path:
                         rel_path = clean_img_path.split("data/images")[-1].strip("/")
                     else:
                         rel_path = os.path.basename(clean_img_path)

                import time
                r['image_path'] = f"http://localhost:8000/data/{rel_path}?t={int(time.time())}"
                
                if r.get("interpretation"):
                    r['interpretation'] = interpretation
                final.append(r)
                seen.add(r['id'])
        
        print(f"🎨 SKETCH: Returning {len(final[:20])} results.")
        return final[:20]
        
    except Exception as e:
        print(f"❌ SKETCH ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ── Conversational Chat Search ──────────────────────────────────────────

@app.post("/chat/search")
async def chat_search(req: ChatSearchRequest):
    try:
        print(f"💬 CHAT [{req.session_id}]: '{req.message}'")
        llm_result = process_message(req.session_id, req.message)

        if not llm_result.get("search_ready"):
            return ChatMessageResponse(message=llm_result.get("response", ""))

        # LLM decided we have enough context → run hybrid search
        refined_query = llm_result["refined_query"]
        print(f"💬 CHAT → SEARCH: '{refined_query}'")

        raw_results = image_search.search_by_text(refined_query, top_k=30)
        results = []
        for r in raw_results:
            r["image_path"] = _enrich_image_url(r["image_path"])
            results.append(r)

        return ChatResultsResponse(
            query=refined_query,
            results=results[:30],
        )
    except Exception as e:
        print(f"❌ CHAT ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat search failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Jewelry Recommender — Backend

Multimodal RAG-based jewelry recommendation system powered by **CLIP** embeddings, **FAISS** vector search, **BLIP** captioning, and **Cross-Encoder** reranking.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FastAPI Server                            │
│                                                                  │
│  POST /search/text   ──┐                                         │
│  POST /search/image  ──┤     ┌─────────────────────────────┐     │
│  POST /search/sketch ──┤ ──▶ │  Search Modules             │     │
│  GET  /debug/check   ──┘     │  • image_search (hybrid)    │     │
│                               │  • sketch_search (visual)   │     │
│                               └─────┬───────────────────────┘     │
│                              ┌──────▼──────────────────────┐     │
│                              │  Models                     │     │
│                              │  • CLIP (image + text emb)  │     │
│                              │  • BLIP (captioning)        │     │
│                              └──────┬──────────────────────┘     │
│                              ┌──────▼──────────────────────┐     │
│                              │  Utils                      │     │
│                              │  • reranker (Cross-Encoder) │     │
│                              │  • captioning (BLIP + LLM)  │     │
│                              │  • sketch_utils (OpenCV)    │     │
│                              └─────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

## Folder structure

```
backend/
├── __init__.py
├── config.py              # Paths, device, API keys, constants
├── main.py                # FastAPI app + lifespan (index building)
├── schemas.py             # Pydantic models
├── requirements.txt
├── models/
│   └── clip.py            # CLIP model: image & text embeddings
├── search/
│   ├── image_search.py    # Hybrid FAISS search + Cross-Encoder reranking
│   └── sketch_search.py   # Sketch-to-image search with LLM interpretation
├── utils/
│   ├── captioning.py      # BLIP captioning + LLM sketch description
│   ├── reranker.py        # Cross-Encoder reranker (ms-marco-MiniLM)
│   ├── image_utils.py     # Skew correction utilities
│   └── sketch_utils.py    # Photo-to-sketch & sketch preprocessing
```

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up .env in project root
# OPENAI_API_KEY=your_key_here
# OPENAI_BASE_URL=https://api.openai.com/v1

# 3. Run the server
cd ..  # from backend/ to project root
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Path             | Description                                         |
| ------ | ---------------- | --------------------------------------------------- |
| POST   | `/search/text`   | Text-based jewelry search (hybrid visual + caption) |
| POST   | `/search/image`  | Image-based similarity search                       |
| POST   | `/search/sketch` | Hand-drawn sketch search with AI interpretation     |
| GET    | `/debug/check`   | System health and model status                      |
| GET    | `/data/{path}`   | Static file serving for jewelry images              |

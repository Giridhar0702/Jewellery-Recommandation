# LuxeGem — Multimodal Jewelry Recommendation System

A full-stack **React + FastAPI** application that recommends jewelry through **text descriptions**, **image uploads**, and **hand-drawn sketches** using a Retrieval-Augmented Generation (RAG) pipeline powered by CLIP, BLIP, FAISS, and Cross-Encoder reranking.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [ML Pipeline Deep Dive](#ml-pipeline-deep-dive)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [How It Works (End-to-End)](#how-it-works-end-to-end)
- [Future Improvements](#future-improvements)

---

## Overview

LuxeGem is a multimodal jewelry recommendation engine that allows users to discover jewelry through three distinct search modalities:

1. **Text Search** — Describe what you're looking for in natural language (e.g., _"vintage gold ring with emerald stone"_).
2. **Image Search** — Upload a photo of jewelry to find visually similar items from the catalog.


The system employs a **hybrid retrieval** strategy that fuses visual CLIP embeddings with semantic caption matching, followed by **Cross-Encoder reranking** for high-precision results.

---

## Key Features

| Feature                     | Description                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| **Text Search**             | Natural language queries matched against both visual CLIP embeddings and BLIP-generated captions |
| **Image Search**            | Upload a photo to retrieve visually similar jewelry via FAISS cosine similarity                  |
| **Sketch Search**           | Hand-drawn sketch → AI interpretation (GPT-4.1 Nano) → hybrid visual + semantic retrieval        |
| **Hybrid Retrieval**        | Fuses CLIP visual scores with caption-embedding scores using configurable weights                |
| **Cross-Encoder Reranking** | `ms-marco-MiniLM-L-6-v2` reranker refines top candidates for superior relevance                  |
| **BLIP Captioning**         | Automatic offline caption generation for every catalog image                                     |
| **FAISS Vector Search**     | Efficient approximate nearest-neighbor search over normalized embeddings                         |
| **Drag & Drop Upload**      | Frontend supports drag-and-drop image upload alongside file picker                               |
| **Responsive UI**           | Tailwind CSS responsive grid with hover effects, match-score badges, and animations              |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             Frontend (React)                            │
│   Navbar ─ Hero (Search + Upload) ─ ProductGrid ─ Footer                │
│                          Axios → localhost:8000                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ HTTP
┌─────────────────────────────▼───────────────────────────────────────────┐
│                        FastAPI Backend                                   │
│                                                                          │
│  POST /search/text   ──┐                                                 │
│  POST /search/image  ──┤     ┌──────────────────────────────────┐        │
│  POST /search/sketch ──┤ ──▶ │  Search Modules                  │        │
│  GET  /debug/check   ──┘     │  • image_search (hybrid fusion)  │        │
│                               │  • sketch_search (AI interpret)  │        │
│                               └──────┬──────────────────────────┘        │
│                               ┌──────▼──────────────────────────┐        │
│                               │  Models                          │        │
│                               │  • CLIP ViT-B/32 (embeddings)    │        │
│                               │  • BLIP (image captioning)       │        │
│                               └──────┬──────────────────────────┘        │
│                               ┌──────▼──────────────────────────┐        │
│                               │  Utils                           │        │
│                               │  • Cross-Encoder Reranker        │        │
│                               │  • OpenCV Sketch Processing      │        │
│                               │  • GPT-4.1 Nano (sketch → text)  │        │
│                               └─────────────────────────────────┘        │
│                                                                          │
│  FAISS Indexes:  faiss_image.index  │  faiss_sketch.index                │
│  Metadata:       metadata.npy  │  metadata_with_captions.json            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Component             | Technology                                                             |
| --------------------- | ---------------------------------------------------------------------- |
| Web Framework         | **FastAPI** with Uvicorn ASGI server                                   |
| Embeddings            | **OpenAI CLIP** (`clip-vit-base-patch32`) via HuggingFace Transformers |
| Captioning            | **Salesforce BLIP** (`blip-image-captioning-base`)                     |
| Vector Database       | **FAISS** (`faiss-cpu`) — Inner Product index with L2 normalization    |
| Reranking             | **Cross-Encoder** (`ms-marco-MiniLM-L-6-v2`) via Sentence-Transformers |
| Sketch Interpretation | **OpenAI GPT-4.1 Nano** (multimodal vision API)                        |
| Image Processing      | **OpenCV** + **Pillow**                                                |
| Validation            | **Pydantic** v2                                                        |
| Compute               | **PyTorch** (CUDA-accelerated when available)                          |

### Frontend

| Component   | Technology                                    |
| ----------- | --------------------------------------------- |
| Framework   | **React 18** (Create React App)               |
| HTTP Client | **Axios**                                     |
| Styling     | **Tailwind CSS 3.4** + PostCSS + Autoprefixer |
| Icons       | **Lucide React**                              |
| Animations  | **Framer Motion**                             |

---

## Project Structure

```
Jewellery_Recommender/
├── README.md                          # This file
│
├── backend/
│   ├── __init__.py
│   ├── config.py                      # Paths, device, API keys, constants
│   ├── main.py                        # FastAPI app, lifespan manager, routes
│   ├── schemas.py                     # Pydantic request/response models
│   ├── requirements.txt               # Python dependencies
│   │
│   ├── models/
│   │   └── clip.py                    # CLIP model: image & text embeddings
│   │
│   ├── search/
│   │   ├── image_search.py            # Hybrid FAISS search + Cross-Encoder reranking
│   │   └── sketch_search.py           # Sketch-to-image search with LLM interpretation
│   │
│   └── utils/
│       ├── captioning.py              # BLIP captioning + LLM sketch description
│       ├── reranker.py                # Cross-Encoder reranker (ms-marco-MiniLM)
│       ├── image_utils.py             # Skew correction utilities (Hough + rotation)
│       └── sketch_utils.py            # Photo-to-sketch conversion & sketch preprocessing
│
├── frontend/
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                     # Main app: state management, API calls
│       ├── index.js                   # React entry point
│       ├── index.css                  # Tailwind imports + global styles
│       └── components/
│           ├── Navbar.jsx             # Fixed top nav with brand logo & icons
│           ├── Hero.jsx               # Hero section: search bar + image upload
│           ├── ProductGrid.jsx        # Responsive product cards with hover effects
│           ├── Footer.jsx             # Site footer with links & contact info
│           ├── ImageUpload.js         # Legacy image upload component
│           ├── TextSearch.js          # Legacy text search component
│           └── RecommendationGrid.js  # Placeholder for future recommendations
│
├── indexes/
│   ├── faiss_image.index              # FAISS index for product image embeddings
│   ├── faiss_sketch.index             # FAISS index for sketch-style embeddings
│   ├── metadata.npy                   # Numpy array of product metadata dicts
│   └── metadata_with_captions.json    # Full metadata with BLIP-generated captions
│
└── uploads/                           # Temporary storage for uploaded files
```

---

## ML Pipeline Deep Dive

### 1. Indexing (Startup — Lifespan Manager)

On server startup, the `lifespan` context manager executes the following pipeline:

1. **Catalog Scan** — Walks the data directory, discovering images organized by category folders (e.g., `ring/`, `necklace/`).
2. **Caption Generation** — For each new image, BLIP generates a descriptive caption (e.g., _"a photograph of a gold ring with a large blue sapphire stone"_). Cached in `metadata_with_captions.json`.
3. **Visual Index Build** — Each image is embedded using CLIP ViT-B/32, L2-normalized, and inserted into a FAISS `IndexFlatIP` (inner product ≈ cosine similarity). Processed in batches of 32.
4. **Sketch Index Build** — Each catalog photo is converted to a pencil-sketch representation using OpenCV (grayscale → invert → Gaussian blur → color-dodge blend), then embedded with CLIP and indexed separately.
5. **Caption Pre-embedding** — All textual captions are encoded with CLIP's text encoder and cached as a NumPy matrix for fast dot-product search at query time.

### 2. Text Search Pipeline

```
User Query
    │
    ├──▶ CLIP Text Encoder ──▶ Visual Search (FAISS top-50)
    │                                 │
    ├──▶ Caption Dot-Product ─────────▶ Semantic Search (top-50)
    │                                       │
    └──────────────── Hybrid Fusion (union, weighted score) ──┐
                                                               │
                         Cross-Encoder Reranking (query vs caption) ──▶ Top-K Results
```

- **Visual Weight**: 0.5 — CLIP image-text similarity
- **Caption Weight**: 0.5 — CLIP text-text similarity against BLIP captions
- **Reranking**: `ms-marco-MiniLM-L-6-v2` compares the raw query against each candidate's caption for fine-grained relevance scoring

### 3. Image Search Pipeline

```
Uploaded Image ──▶ CLIP Image Encoder ──▶ FAISS Inner Product Search ──▶ Top-K Results
```

Direct visual similarity — the uploaded image is embedded and matched against the pre-built image index.

### 4. Sketch Search Pipeline

```
Hand-drawn Sketch
    │
    ├──▶ OpenCV Preprocessing (resize, threshold, clean)
    │         │
    │         ├──▶ CLIP Image Encoder ──▶ Sketch FAISS Index (visual shape match)
    │         │
    │         └──▶ GPT-4.1 Nano Vision ──▶ JSON { type, description }
    │                                            │
    │                                            └──▶ Text Search Pipeline (semantic match)
    │
    └──▶ Hybrid Fusion + Strict Type Filter + Cross-Encoder Reranking ──▶ Top-K Results
```

The sketch pipeline is the most sophisticated: it combines **shape matching** (visual embeddings of the sketch against sketch-ified catalog images) with **semantic understanding** (LLM interprets the drawing and generates a text query). Category-level filtering (ring vs. necklace) is enforced based on the LLM's classification.

---

## API Reference

### `POST /search/text`

Text-based jewelry search with hybrid retrieval and reranking.

**Request Body:**

```json
{
  "query": "vintage gold ring with emerald stone",
  "top_k": 30
}
```

**Response:**

```json
{
  "query": "vintage gold ring with emerald stone",
  "refined_query": null,
  "results": [
    {
      "id": "ring_001.jpg",
      "image_path": "http://localhost:8000/data/ring/ring_001.jpg?t=1707900000",
      "score": 0.95,
      "category": "ring",
      "caption": "a photograph of a gold ring with a green emerald stone",
      "interpretation": null
    }
  ]
}
```

### `POST /search/image`

Image-based similarity search. Accepts multipart file upload.

**Request:** `multipart/form-data` with field `file` (JPEG/PNG)

**Response:** Array of `SearchResult` objects.

### `POST /search/sketch`

Sketch-based search with AI interpretation. Accepts multipart file upload.

**Request:** `multipart/form-data` with field `file` (JPEG/PNG sketch)

**Response:** Array of `SearchResult` objects with `interpretation` field populated.

### `GET /debug/check`

System health check — reports model load status, data directory info, and index states.

### `GET /data/{path}`

Static file serving for jewelry catalog images.

---

## Frontend Components

| Component       | File              | Description                                                                                              |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Navbar**      | `Navbar.jsx`      | Fixed top navigation bar with "LuxeGem" branding, nav links, and icon buttons (Search, Camera)           |
| **Hero**        | `Hero.jsx`        | Full-viewport hero section with text search input, drag-and-drop image upload, and quick-search tags     |
| **ProductGrid** | `ProductGrid.jsx` | Responsive grid of product cards with image zoom on hover, match-score badges, heart/cart action buttons |
| **Footer**      | `Footer.jsx`      | 4-column responsive footer with brand info, quick links, and contact details                             |

---

## Getting Started

### Prerequisites

| Requirement    | Version                              |
| -------------- | ------------------------------------ |
| Python         | 3.8+                                 |
| Node.js        | 14+                                  |
| npm            | 6+                                   |
| GPU (optional) | CUDA-compatible for faster inference |

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Jewellery_Recommender
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Run the backend server
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`.

> **Note:** On first startup, the system will download CLIP (~600 MB), BLIP (~1 GB), and the Cross-Encoder model. It will also build FAISS indexes from the data directory, which may take several minutes depending on catalog size.

### 3. Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm start
```

The frontend will open at `http://localhost:3000` and proxy API requests to the backend.

---

## Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

| Variable          | Required                | Description                                  |
| ----------------- | ----------------------- | -------------------------------------------- |
| `OPENAI_API_KEY`  | Yes (for sketch search) | OpenAI API key for GPT-4.1 Nano vision calls |
| `OPENAI_BASE_URL` | Optional                | Custom base URL for OpenAI-compatible APIs   |

> **Note:** The API key is only required for the **sketch search** feature. Text search and image search work fully offline.

---

## Usage

### Text Search

1. Type a description in the search bar (e.g., _"diamond necklace with pendant"_).
2. Press Enter or click the search icon.
3. Results appear ranked by hybrid relevance score.

### Image Search

1. Click the upload area or drag-and-drop an image onto the Hero section.
2. The system finds visually similar items from the catalog.

### Sketch Search

1. Draw a sketch of the desired jewelry piece on paper.
2. Take a photo or scan it and upload through the interface.
3. The AI interprets the sketch, classifies the jewelry type, and retrieves matching products.

### Quick Search Tags

Click preset tags like _"Vintage Rings"_ or _"Diamond Necklace"_ in the Hero section for instant curated results.

---

## How It Works (End-to-End)

```
                        ┌──────────────────────────┐
                        │   Jewelry Data Directory  │
                        │   (organized by category) │
                        └─────────┬────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Startup Pipeline        │
                    │  1. Scan images             │
                    │  2. BLIP caption each       │
                    │  3. CLIP embed → FAISS      │
                    │  4. Sketch-ify → FAISS      │
                    │  5. Pre-embed captions       │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────▼────────────────────┐
              │            Query Time                    │
              │                                          │
              │  Text ──▶ Hybrid (Visual + Caption)      │
              │  Image ──▶ Direct FAISS Lookup           │
              │  Sketch ──▶ LLM Interpret + Hybrid       │
              │                   │                      │
              │         Cross-Encoder Rerank             │
              │                   │                      │
              │            Top-K Results                 │
              └──────────────────┬────────────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │   React Frontend        │
                     │   Product Grid Display   │
                     └─────────────────────────┘
```

---

## Future Improvements

- **Sketch Canvas** — In-browser drawing canvas to eliminate the need for photo uploads of sketches
- **Category Expansion** — Support for bracelets, earrings, bangles, and other jewelry types
- **User Feedback Loop** — Collect implicit/explicit feedback to fine-tune retrieval relevance
- **Query Refinement** — LLM-powered query expansion and disambiguation
- **Authentication** — User accounts with saved searches and wishlists
- **Deployment** — Dockerized setup with GPU support for production environments
- **Caching** — Redis-based embedding cache for frequently searched queries

import os
import torch
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _resolve_path(env_name: str, default_path: str) -> str:
    raw_value = os.getenv(env_name)
    if not raw_value:
        return default_path
    value = os.path.expanduser(raw_value)
    if not os.path.isabs(value):
        value = os.path.abspath(os.path.join(BASE_DIR, value))
    return value


# Paths
DATA_DIR = _resolve_path("DATA_DIR", os.path.join(BASE_DIR, "data"))
INDEX_DIR = _resolve_path("INDEX_DIR", os.path.join(BASE_DIR, "indexes"))
UPLOAD_DIR = _resolve_path("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))

# Ensure dirs exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(INDEX_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Device
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# API Keys
API_KEY = os.getenv("OPENAI_API_KEY")
BASE_URL = os.getenv("OPENAI_BASE_URL")
LLM_MODEL = "gpt-4.1-nano" # Or your specific model name

# Constants
TOP_K = 30

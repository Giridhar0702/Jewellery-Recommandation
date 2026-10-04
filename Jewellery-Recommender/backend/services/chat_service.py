"""
Conversational Jewelry Search Service

Manages multi-turn chat sessions and uses an LLM to decide
when enough context has been gathered to trigger a search.
"""

import json
from typing import Dict, List, Tuple, Optional
from openai import OpenAI
from backend.config import API_KEY, BASE_URL, LLM_MODEL

# ---------------------------------------------------------------------------
# In-memory session store: { session_id: [ {role, content}, ... ] }
# Only the last MAX_HISTORY messages are kept per session.
# ---------------------------------------------------------------------------
MAX_HISTORY = 6
_sessions: Dict[str, List[dict]] = {}

# ---------------------------------------------------------------------------
# OpenAI client (reused across calls)
# ---------------------------------------------------------------------------
_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    return _client


# ---------------------------------------------------------------------------
# System prompt — instructs the LLM to act as a jewelry shopping assistant
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are a helpful jewelry shopping assistant for a luxury jewelry store.

Your goal is to understand what kind of jewelry the user is looking for by \
having a natural, concise conversation. You may ask clarifying questions \
about type (ring, necklace), material, gemstones, occasion, style, etc.

RULES:
1. If the user's intent is already clear enough to search (they mention \
   specific attributes like type + material, or a concrete description), \
   respond with search_ready = true and a refined_query that is an \
   optimized, descriptive search string.
2. If you need more information, respond with search_ready = false and a \
   short, friendly clarifying question.
3. Keep your clarifying questions concise (1-2 sentences max).
4. Never ask more than one question at a time.
5. If the user provides enough detail in a single message, do NOT ask \
   unnecessary follow-ups — go straight to search.

You MUST respond with ONLY valid JSON in this exact format — no markdown, \
no extra text, no code fences:

If clarification needed:
{"search_ready": false, "response": "your question here"}

If ready to search:
{"search_ready": true, "refined_query": "optimized search query"}
"""


def _trim_history(history: List[dict]) -> List[dict]:
    """Keep only the last MAX_HISTORY messages."""
    return history[-MAX_HISTORY:]


def get_session(session_id: str) -> List[dict]:
    """Return (or create) the conversation history for a session."""
    if session_id not in _sessions:
        _sessions[session_id] = []
    return _sessions[session_id]


def clear_session(session_id: str) -> None:
    """Remove a session's history."""
    _sessions.pop(session_id, None)


def process_message(session_id: str, user_message: str) -> dict:
    """
    Append the user message, call the LLM, and return a parsed dict:
        { "search_ready": bool, "response"|"refined_query": str }

    Raises ValueError on unparseable LLM output.
    """
    history = get_session(session_id)

    # Append user turn
    history.append({"role": "user", "content": user_message})
    history[:] = _trim_history(history)

    # Build messages payload for the LLM
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    client = _get_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        max_tokens=200,
        temperature=0.3,
        timeout=20.0,
    )

    raw_content = response.choices[0].message.content.strip()

    # Strip markdown code fences if the model wraps its output
    if raw_content.startswith("```"):
        raw_content = raw_content.split("```")[1]
        if raw_content.startswith("json"):
            raw_content = raw_content[4:]
        raw_content = raw_content.strip()

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        # Fallback: treat raw text as a clarifying response
        parsed = {"search_ready": False, "response": raw_content}

    # Append assistant turn (store the clarifying question or the query)
    assistant_text = parsed.get("response") or parsed.get("refined_query", "")
    history.append({"role": "assistant", "content": assistant_text})
    history[:] = _trim_history(history)

    return parsed

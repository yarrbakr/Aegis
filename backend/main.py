"""Aegis backend — FastAPI service.

Hosts AI meal-plan generation and the deterministic safety guardrails.
Phase 0 ships only /health so we can deploy an empty pipeline to a live URL
*before* building any features (the de-risk rule in playbook/Phases.md).

Run locally from the repo root:
    uvicorn backend.main:app --reload
On Render (root directory = backend):
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Aegis API",
    description="AI meal planning with a deterministic safety shield.",
    version="0.1.0",
)

# Let the Next.js frontend call this API. During local dev this is "*";
# in production, set FRONTEND_ORIGIN to the deployed Vercel origin(s).
_origins = [o.strip() for o in os.getenv("FRONTEND_ORIGIN", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe. Deployed first so we can prove the pipeline works."""
    return {"status": "ok", "service": "aegis-api"}


@app.get("/")
def root() -> dict[str, str]:
    """Friendly root so hitting the bare URL isn't a 404."""
    return {"message": "Aegis API is running. See /health for liveness and /docs for the API."}

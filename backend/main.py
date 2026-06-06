"""
GitRepo-Dev · FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
import logging, os

from models.db import init_db
from routers.analyze  import router as analyze_router
from routers.generate import router as generate_router
from routers.metrics  import router as metrics_router
from middleware.errors    import validation_error_handler, general_error_handler
from middleware.ratelimit import rate_limit_middleware

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(
    title="GitRepo-Dev API",
    description="AI-powered GitHub repo analysis.",
    version="1.0.0",
)

# ── Middleware ────────────────────────────────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

# ── Error handlers ────────────────────────────────────────────────────────────
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, general_error_handler)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(analyze_router)
app.include_router(generate_router)
app.include_router(metrics_router)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()
    logging.info("✅  Database tables ready")
    logging.info("✅  GitRepo-Dev API running → http://localhost:8000")
    logging.info("📖  Swagger UI → http://localhost:8000/docs")

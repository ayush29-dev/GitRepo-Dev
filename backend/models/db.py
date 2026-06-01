"""
Database models — 3 tables:
  1. repo_analyses     → one row per analyzed repo
  2. bug_reports       → many rows per repo (one per detected bug)
  3. generated_reports → tracks every file uploaded to S3

SQLAlchemy lets us write Python classes instead of raw SQL.
The relationship() lines link tables together like foreign keys.
"""

from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String,
    Float, DateTime, Text, ForeignKey, Enum
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Build the MySQL connection URL from your .env file
# Format: mysql+pymysql://user:password@host:port/database
DATABASE_URL = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT', 3306)}/{os.getenv('DB_NAME')}"
)

# engine = the actual connection to MySQL
# pool_pre_ping=True → test connection before each use (handles dropped connections)
# pool_recycle=3600  → refresh connections every hour
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

# SessionLocal = a factory that creates DB sessions
# Each request gets its own session (opened + closed per request)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = parent class all our models inherit from
Base = declarative_base()


# ── TABLE 1: repo_analyses ────────────────────────────────────────────────────
class RepoAnalysis(Base):
    __tablename__ = "repo_analyses"

    id             = Column(Integer, primary_key=True, index=True)
    repo_full_name = Column(String(255), nullable=False, index=True)  # "facebook/react"
    stack          = Column(String(100))           # "Python", "JS/TS", "C"
    total_files    = Column(Integer, default=0)
    quality_score  = Column(Float, default=0.0)    # 0–100, from LLM
    doc_score      = Column(Float, default=0.0)    # 0–100, from LLM
    summary        = Column(Text)                  # LLM-generated paragraph
    readme_s3_key  = Column(String(512))           # S3 path of generated README
    analyzed_at    = Column(DateTime, default=datetime.utcnow)

    # These lines say: "one repo has many bugs / many reports"
    # cascade="all, delete-orphan" means: if repo is deleted, delete its bugs too
    bugs    = relationship("BugReport",       back_populates="repo", cascade="all, delete-orphan")
    reports = relationship("GeneratedReport", back_populates="repo", cascade="all, delete-orphan")


# ── TABLE 2: bug_reports ──────────────────────────────────────────────────────
class BugReport(Base):
    __tablename__ = "bug_reports"

    id          = Column(Integer, primary_key=True, index=True)
    repo_id     = Column(Integer, ForeignKey("repo_analyses.id"), nullable=False)  # links to table 1
    severity    = Column(Enum("critical", "high", "medium", "low"), nullable=False, index=True)
    bug_type    = Column(String(255))    # "Null dereference", "SQL injection", etc.
    file_path   = Column(String(512))   # "src/core/renderer.c"
    line_number = Column(Integer)       # line where bug was found (or null)
    language    = Column(String(50))    # "Python", "C", "JS", etc.
    description = Column(Text)          # LLM explanation of what's wrong
    suggestion  = Column(Text)          # LLM fix suggestion
    detected_at = Column(DateTime, default=datetime.utcnow)

    repo = relationship("RepoAnalysis", back_populates="bugs")


# ── TABLE 3: generated_reports ────────────────────────────────────────────────
class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id          = Column(Integer, primary_key=True, index=True)
    repo_id     = Column(Integer, ForeignKey("repo_analyses.id"), nullable=False)
    report_type = Column(Enum("full", "bugs", "readme", "docs", "optimization"), nullable=False)
    s3_key      = Column(String(512), nullable=False)   # path inside S3 bucket
    file_size   = Column(Integer)                        # bytes
    created_at  = Column(DateTime, default=datetime.utcnow)

    repo = relationship("RepoAnalysis", back_populates="reports")


# ── DB session dependency (used by FastAPI) ───────────────────────────────────
def get_db():
    """
    FastAPI calls this automatically for every request that needs the DB.
    It opens a session, gives it to the route function, then closes it after.
    The 'yield' makes it a generator — code after yield runs on cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Create tables ─────────────────────────────────────────────────────────────
def init_db():
    """
    Creates all tables in MySQL if they don't exist yet.
    Safe to call multiple times — won't drop existing tables.
    Called once when the server starts (in main.py).
    """
    Base.metadata.create_all(bind=engine)

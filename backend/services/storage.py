"""
AWS S3 service — 3 jobs:
  1. upload_text()         → upload a string (README, docs) to S3
  2. get_presigned_url()   → create a temporary download link (1 hour)
  3. get_file_size()       → check how big an uploaded file is

Why S3?
  Generated READMEs and docs can be large.
  Storing them in S3 is cheaper than MySQL TEXT columns,
  and S3 presigned URLs let users download directly without
  routing through your EC2 server.

Local dev note:
  Uses AWS keys from .env. On EC2 in production, the IAM role
  handles auth automatically — no keys needed on the server.
"""

import boto3
import uuid
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# boto3.client() creates an S3 connection using your credentials
s3_client = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION", "ap-south-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

BUCKET       = os.getenv("S3_BUCKET", "gitrepo-dev-reports")
URL_EXPIRY   = 3600   # presigned URLs expire after 1 hour (in seconds)


def _build_key(repo_name: str, report_type: str, ext: str) -> str:
    """
    Build a unique S3 file path (called a "key").
    Example: reports/facebook-react/2026-05-28/readme-a1b2c3.md

    We use uuid for uniqueness so re-running analysis doesn't overwrite old files.
    repo_name has "/" replaced with "-" since "/" creates folders in S3.
    """
    safe_name = repo_name.replace("/", "-")
    date      = datetime.utcnow().strftime("%Y-%m-%d")
    uid       = uuid.uuid4().hex[:6]   # short 6-char random ID e.g. "a1b2c3"
    return f"reports/{safe_name}/{date}/{report_type}-{uid}.{ext}"


def upload_text(content: str, repo_name: str, report_type: str, ext: str = "md") -> str:
    """
    Upload a text string to S3.
    Returns the S3 key (path) — store this in MySQL to retrieve the file later.

    content     = the string to upload (README markdown, docstrings, etc.)
    repo_name   = "facebook/react"
    report_type = "readme", "docs", "bugs", etc.
    ext         = file extension: "md", "txt", "json"
    """
    key = _build_key(repo_name, report_type, ext)

    s3_client.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=content.encode("utf-8"),
        # ContentType tells browsers how to handle the file when downloaded
        ContentType="text/markdown" if ext == "md" else "text/plain",
    )

    return key   # caller saves this key to MySQL


def get_presigned_url(s3_key: str, expiry_seconds: int = URL_EXPIRY) -> str:
    """
    Generate a temporary download URL for an S3 file.

    Presigned URL = a special URL that includes auth credentials baked in.
    Anyone with the URL can download the file for `expiry_seconds` seconds.
    After that, the URL stops working — secure by default.

    This is what powers the "Download" buttons in your React dashboard.
    """
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": s3_key},
        ExpiresIn=expiry_seconds,
    )


def get_file_size(s3_key: str) -> int:
    """
    Return the file size in bytes for a given S3 key.
    Used to show "1.2 MB" labels in the dashboard.
    Returns 0 if the file doesn't exist (safe fallback).
    """
    try:
        head = s3_client.head_object(Bucket=BUCKET, Key=s3_key)
        return head["ContentLength"]
    except Exception:
        return 0

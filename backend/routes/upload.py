"""
routes/upload.py
----------------
POST /api/upload-reference
Accepts a file upload and returns the extracted plain text,
which the frontend passes into the generation request as reference_content.

Supported formats:
  - .pdf   — extracts text via pypdf
  - .docx  — extracts text via python-docx
  - .txt / .md / .text — read as UTF-8 plain text
"""

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

MAX_BYTES = 5 * 1024 * 1024  # 5 MB hard cap


@router.post("")
async def upload_reference(file: UploadFile = File(...)):
    """Extract plain text from an uploaded reference document."""
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 5 MB limit.")

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    # ── PDF ───────────────────────────────────────────────────────────────
    if filename.endswith(".pdf") or "pdf" in content_type:
        text = _extract_pdf(raw)

    # ── DOCX ─────────────────────────────────────────────────────────────
    elif filename.endswith(".docx") or "wordprocessingml" in content_type:
        text = _extract_docx(raw)

    # ── Plain text / Markdown ────────────────────────────────────────────
    elif filename.endswith((".txt", ".md", ".text")) or "text" in content_type:
        try:
            text = raw.decode("utf-8", errors="replace")
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Could not decode file: {exc}")

    else:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload a PDF, DOCX, TXT, or Markdown file.",
        )

    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the file.")

    # Truncate to 12 000 chars to stay within LLM context budget
    truncated = text[:12_000]
    return {
        "filename": file.filename,
        "char_count": len(truncated),
        "text": truncated,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _extract_pdf(raw: bytes) -> str:
    try:
        import io
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(raw))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to read PDF: {exc}")


def _extract_docx(raw: bytes) -> str:
    try:
        import io
        from docx import Document

        doc = Document(io.BytesIO(raw))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to read DOCX: {exc}")

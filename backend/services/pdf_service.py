"""
services/pdf_service.py
-----------------------
Converts a Markdown string into a styled PDF using WeasyPrint.
Returns raw bytes that can be sent directly as a FastAPI response.
"""

from __future__ import annotations

import markdown as md_lib


# ---------------------------------------------------------------------------
# CSS — dark-ish professional styling that prints well on white paper
# ---------------------------------------------------------------------------

_CSS = """
@page {
    margin: 2.5cm 2.2cm 2.5cm 2.2cm;
}

body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #1a1a2e;
}

h1 {
    font-size: 22pt;
    color: #1a1a2e;
    border-bottom: 3px solid #4f46e5;
    padding-bottom: 6pt;
    margin-bottom: 4pt;
}

h2 {
    font-size: 15pt;
    color: #312e81;
    border-bottom: 1px solid #c7d2fe;
    padding-bottom: 3pt;
    margin-top: 22pt;
    margin-bottom: 6pt;
}

h3 {
    font-size: 12pt;
    color: #3730a3;
    margin-top: 14pt;
    margin-bottom: 4pt;
}

h4 {
    font-size: 11pt;
    color: #4338ca;
    margin-top: 10pt;
}

p {
    margin: 0 0 9pt 0;
}

ul, ol {
    margin: 0 0 9pt 0;
    padding-left: 20pt;
}

li {
    margin-bottom: 3pt;
}

blockquote {
    margin: 10pt 0;
    padding: 8pt 14pt;
    border-left: 4px solid #4f46e5;
    background: #eef2ff;
    color: #3730a3;
}

blockquote p {
    margin: 0;
}

code {
    font-family: Courier, monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    padding: 1pt 4pt;
    color: #4338ca;
}

pre {
    background: #f1f5f9;
    padding: 10pt;
    font-size: 9pt;
    border: 1px solid #e2e8f0;
    margin: 8pt 0;
}

pre code {
    background: none;
    padding: 0;
    color: #1e293b;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 10pt;
}

th {
    background: #4f46e5;
    color: white;
    padding: 6pt 10pt;
    text-align: left;
    font-weight: bold;
}

td {
    padding: 5pt 10pt;
    border-bottom: 1px solid #e2e8f0;
}

hr {
    border-top: 1px solid #e2e8f0;
    margin: 16pt 0;
}

strong {
    font-weight: bold;
    color: #1e293b;
}

em {
    color: #475569;
}

a {
    color: #4f46e5;
}
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def markdown_to_pdf(markdown_text: str) -> bytes:
    """Convert a Markdown string to PDF bytes."""
    import io
    from xhtml2pdf import pisa

    html_body = md_lib.markdown(
        markdown_text,
        extensions=["tables", "fenced_code", "toc", "attr_list", "nl2br"],
    )

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>{_CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""

    buf = io.BytesIO()
    result = pisa.CreatePDF(full_html, dest=buf)
    if result.err:
        raise RuntimeError(f"PDF generation failed with {result.err} error(s).")
    return buf.getvalue()

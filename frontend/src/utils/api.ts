/**
 * utils/api.ts
 * ------------
 * Calls the backend document-generation SSE endpoint.
 * All /api/* requests go through the Next.js rewrite proxy defined in
 * next.config.mjs, so no hard-coded base URL is needed.
 */

export interface GenerateRequest {
  title: string;
  document_type: string;
  topic: string;
  style: string;
  additional_instructions?: string;
  reference_content?: string;
}

export interface AgentEvent {
  type: string;
  /** tool_call */
  name?: string;
  args?: unknown;
  /** tool_result */
  result?: string;
  /** outline_planned */
  sections?: unknown;
  /** section_written */
  section_id?: string;
  heading?: string;
  /** complete */
  document?: string;
  /** error */
  message?: string;
}

/**
 * Stream document-generation events from the backend agent.
 *
 * @param request   Form data describing the desired document.
 * @param onEvent   Callback invoked for every SSE event received.
 */
export async function generateDocument(
  request: GenerateRequest,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const response = await fetch("/api/generate/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Server error ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("Response body is null — streaming not supported.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on newlines; keep incomplete last chunk in buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const event: AgentEvent = JSON.parse(payload);
        onEvent(event);
      } catch {
        // Skip malformed events
      }
    }
  }
}

/**
 * Upload a reference file (PDF, DOCX, TXT, MD) and get back the extracted text.
 */
export async function uploadReference(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/upload-reference", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Upload failed ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.text as string;
}

/**
 * Convert a Markdown string to a PDF and trigger a browser download.
 */
export async function downloadAsPdf(markdown: string, filename: string): Promise<void> {
  const response = await fetch("/api/generate/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown, filename }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`PDF generation failed ${response.status}: ${text}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

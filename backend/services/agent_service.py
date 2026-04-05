"""
agent_service.py
----------------
Orchestrates the agentic document generation loop using LangChain.

Flow:
  1. Send user request to the LLM along with tool definitions.
  2. The LLM calls tools iteratively (plan â†’ write sections â†’ finalize).
  3. Each tool call / result is yielded as an SSE event so the frontend
     can display live progress.
  4. When finalize_document is called the assembled Markdown is yielded
     as a "complete" event.
"""

from __future__ import annotations

from typing import Any, AsyncGenerator

from langchain_core.messages import (
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)

from services.llm_service import get_llm
from tools.document_tools import DocumentBuilder, execute_tool, get_tool_definitions

# ---------------------------------------------------------------------------
# Agent system prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are an expert professional document writer and formatter. \
Your goal is to produce comprehensive, polished, and beautifully structured documents.

## STRICT PROCESS â€” follow this order:
1. Call `plan_document_outline` FIRST to define every section.
2. Call `write_section` for EVERY section in the outline â€” do not skip any.
3. Call `finalize_document` LAST to compile the complete document.

## WRITING REQUIREMENTS:
- Every section must be **comprehensive** (300â€“600 words minimum).
- Use rich Markdown inside every section's content field:
  - `###` subheadings to break up long sections
  - **bold** for key terms and emphasis
  - *italic* for secondary emphasis, terminology, or titles
  - Bullet lists (`-`) for unordered items
  - Numbered lists (`1.`) for sequential steps or ranked items
  - Markdown tables (`| Header | Header |\\n|---|---|`) for comparative/tabular data
  - Blockquotes (`> text`) for key insights, quotes, callouts, warnings, or tips
  - ` ```code``` ` blocks for any technical content or examples
- Maintain a consistent, appropriate tone throughout (matching the requested style).
- Include concrete examples, data, and actionable recommendations where relevant.
- After writing ALL sections, you MUST call `finalize_document` â€” never stop without it.
"""


# ---------------------------------------------------------------------------
# Agent service
# ---------------------------------------------------------------------------


class DocumentAgentService:
    MAX_ITERATIONS = 30

    def __init__(self) -> None:
        llm = get_llm()
        self.model = llm.bind_tools(get_tool_definitions())

    async def generate(
        self,
        title: str,
        document_type: str,
        topic: str,
        style: str,
        additional_instructions: str | None,
        reference_content: str | None = None,
    ) -> AsyncGenerator[dict, None]:
        """Yield SSE event dicts as the agent builds the document."""

        builder = DocumentBuilder(title=title, document_type=document_type, style=style)

        extra = (
            f"\n\nAdditional instructions: {additional_instructions}"
            if additional_instructions
            else ""
        )

        reference_block = (
            f"\n\n---\n## REFERENCE DOCUMENT\nUse the following uploaded document as your primary reference. "
            f"Base the content, structure, and key points of your output on this material:\n\n{reference_content}\n---"
            if reference_content
            else ""
        )

        user_message = (
            f"Create a **{style}** *{document_type}* document titled: \"{title}\".\n\n"
            f"Topic / Description:\n{topic}{extra}{reference_block}\n\n"
            "Remember the required process:\n"
            "1. Plan the full outline first.\n"
            "2. Write every section with rich, detailed Markdown content.\n"
            "3. Call finalize_document when all sections are complete."
        )

        messages: list = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ]

        for _ in range(self.MAX_ITERATIONS):
            response: AIMessage = await self.model.ainvoke(messages)
            messages.append(response)

            # No tool calls â†’ agent finished (or gave up early)
            if not response.tool_calls:
                if not builder.finalized:
                    yield {"type": "complete", "document": builder.compile_document()}
                break

            for tool_call in response.tool_calls:
                name: str = tool_call["name"]
                args: dict[str, Any] = tool_call["args"]  # already a parsed dict
                call_id: str = tool_call["id"]

                # Stream tool call event to frontend
                yield {"type": "tool_call", "name": name, "args": _safe_args(name, args)}

                result_str, event = execute_tool(name, args, builder)

                if event:
                    yield event

                yield {
                    "type": "tool_result",
                    "name": name,
                    "result": result_str[:300],
                }

                messages.append(
                    ToolMessage(content=result_str, tool_call_id=call_id)
                )

                # Stop as soon as the document is finalized
                if name == "finalize_document" and builder.finalized:
                    yield {"type": "complete", "document": builder.final_document}
                    return

        # Safety net â€” compile whatever was written if not yet finalized
        if not builder.finalized:
            yield {"type": "complete", "document": builder.compile_document()}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_args(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Return a display-safe version of tool args (truncate long strings)."""
    safe: dict[str, Any] = {}
    for key, value in args.items():
        if isinstance(value, str) and len(value) > 200:
            safe[key] = value[:200] + "â€¦"
        elif key == "sections" and isinstance(value, list):
            safe[key] = [
                {"id": s.get("id"), "heading": s.get("heading")} for s in value
            ]
        else:
            safe[key] = value
    return safe

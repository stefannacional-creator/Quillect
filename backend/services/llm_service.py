"""
llm_service.py
--------------
Returns a configured LangChain chat model based on the
LLM_PROVIDER environment variable.

Supported providers
  xai   — xAI Grok  (requires XAI_API_KEY)  — free tier available
  groq  — Groq LLaMA (requires GROQ_API_KEY) — free tier available
"""

import os

from langchain_core.language_models.chat_models import BaseChatModel


def get_llm() -> BaseChatModel:
    """Return a LangChain chat model from env config."""
    provider = os.getenv("LLM_PROVIDER", "groq").lower()

    if provider == "xai":
        from langchain_xai import ChatXAI

        api_key = os.getenv("XAI_API_KEY", "")
        if not api_key:
            raise EnvironmentError(
                "XAI_API_KEY is not set. "
                "Add it to your .env file or environment variables."
            )
        return ChatXAI(
            model=os.getenv("LLM_MODEL", "grok-3-mini"),
            xai_api_key=api_key,  # type: ignore[call-arg]
        )

    elif provider == "groq":
        from langchain_groq import ChatGroq

        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise EnvironmentError(
                "GROQ_API_KEY is not set. "
                "Add it to your .env file or environment variables."
            )
        return ChatGroq(
            model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
            groq_api_key=api_key,  # type: ignore[call-arg]
        )

    else:
        raise ValueError(
            f"Unsupported LLM_PROVIDER '{provider}'. "
            "Valid values: 'xai' (Grok), 'groq' (LLaMA via Groq)."
        )

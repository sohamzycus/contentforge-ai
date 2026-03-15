"""Backward-compatible re-export. New code should import from services.impl.marketing_agent."""
from app.services.impl.marketing_agent import LLMContentStrategy as MarketingAgentService  # noqa: F401

__all__ = ["MarketingAgentService"]

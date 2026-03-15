"""ClaudeContentStrategy — concrete Strategy (GoF) wrapping the LangGraph marketing workflow.

The original MarketingAgentService is preserved as-is but now sits behind
the IContentGenerationStrategy interface so the rest of the application
depends on the abstraction, not the concrete Anthropic/LangGraph implementation.
"""

from typing import TypedDict, List, Dict, Any

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic

from app.services.interfaces.content_generator import IContentGenerationStrategy


class ProductMarketingState(TypedDict):
    product_name: str
    product_description: str
    target_audience: str
    unique_selling_points: List[str]
    audience_insights: str
    competitor_analysis: str
    facebook_post: str
    instagram_caption: str
    tiktok_script: str
    youtube_description: str
    google_ads_copy: str
    image_prompt: str


class ClaudeContentStrategy(IContentGenerationStrategy):
    """Generates multi-platform marketing content via Claude + LangGraph."""

    def __init__(self, api_key: str, base_url: str, model: str):
        self._llm = ChatAnthropic(
            model=model,
            temperature=0.7,
            api_key=api_key,
            base_url=base_url,
        )
        self._workflow = self._build_workflow()

    # ── LangGraph nodes ──────────────────────────────────────────────

    def _research_audience(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        I'm marketing this product: {state["product_name"]}
        Target audience: {state["target_audience"]}

        Provide:
        1. 3 key pain points of this audience
        2. 3 desires/aspirations they have
        3. What tone/language resonates with them
        4. Which platforms they're most active on

        Keep it concise and actionable.
        """
        return {"audience_insights": self._llm.invoke(prompt).content}

    def _analyze_competitors(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        For a product like {state["product_name"]}, what are common marketing approaches?

        Provide:
        1. 2-3 common marketing angles competitors use
        2. What doesn't work in competitor marketing
        3. Opportunity for differentiation

        Keep it brief and strategic.
        """
        return {"competitor_analysis": self._llm.invoke(prompt).content}

    def _create_facebook_content(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        Create a Facebook post for: {state['product_name']}
        Description: {state['product_description']}
        Benefits: {', '.join(state['unique_selling_points'])}
        Audience insights: {state['audience_insights']}

        Facebook post requirements:
        - Length: 150-250 words
        - Start with a relatable story or question
        - Educational tone with clear benefits
        - Include 2-3 bullet points or numbered list
        - Strong CTA at the end
        - Professional but conversational tone
        - NO hashtags
        - Can include emojis sparingly

        Format for readability with line breaks.
        """
        return {"facebook_post": self._llm.invoke(prompt).content}

    def _create_instagram_content(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        Create a VIRAL Instagram caption for: {state['product_name']}
        Description: {state['product_description']}
        Benefits: {', '.join(state['unique_selling_points'])}
        Audience insights: {state['audience_insights']}

        Instagram caption requirements:
        - Length: 50-100 words
        - Start with a BOLD hook that stops the scroll (use power words, curiosity gaps, or hot takes)
        - Focus on lifestyle/aspiration — make them FEEL something
        - Use 3-5 relevant emojis naturally woven in (not clustered)
        - Include a question or CTA to encourage comments and saves
        - Casual, friendly, authentic, Gen-Z/millennial tone
        - End with 10-15 strategic hashtags (mix of trending + niche + branded)
        - Make it SHAREABLE — something people would send to a friend
        """
        return {"instagram_caption": self._llm.invoke(prompt).content}

    def _create_tiktok_content(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        Create a TikTok video script (15-30 seconds) for: {state['product_name']}
        Description: {state['product_description']}
        Benefits: {', '.join(state['unique_selling_points'])}
        Audience insights: {state['audience_insights']}

        TikTok script requirements:
        - Hook in first 1-3 seconds
        - Fast-paced, dynamic content
        - Text overlay suggestions
        - Trending audio/sound suggestions
        - Casual, authentic, entertaining tone
        - End with strong CTA

        Format:
        [0-3 sec]: Hook + text overlay
        [3-15 sec]: Main content
        [15-20 sec]: Product demo
        [20-25 sec]: CTA
        [Audio suggestion]: ...
        [Hashtags]: 4-5 trending + niche hashtags
        """
        return {"tiktok_script": self._llm.invoke(prompt).content}

    def _create_youtube_content(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        Create a YouTube video description for: {state['product_name']}
        Description: {state['product_description']}
        Benefits: {', '.join(state['unique_selling_points'])}
        Audience insights: {state['audience_insights']}

        YouTube description requirements:
        - Opening paragraph (2-3 sentences)
        - Timestamps with topics
        - Detailed product information
        - Links section
        - About section
        - SEO keywords naturally woven in
        - 10-15 relevant hashtags at the end
        - Professional, informative tone
        """
        return {"youtube_description": self._llm.invoke(prompt).content}

    def _create_google_ads_content(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        Create 3 variations of Google Search Ads for: {state['product_name']}
        Description: {state['product_description']}
        Benefits: {', '.join(state['unique_selling_points'])}
        Audience insights: {state['audience_insights']}

        Google Ads requirements (STRICT character limits):
        - Headline 1: Max 30 characters
        - Headline 2: Max 30 characters
        - Headline 3: Max 30 characters
        - Description 1: Max 90 characters
        - Description 2: Max 90 characters

        Create 3 variations:
        Variation 1: Benefit-focused
        Variation 2: Problem-solution focused
        Variation 3: Offer/urgency focused

        Format each variation clearly with character counts.
        """
        return {"google_ads_copy": self._llm.invoke(prompt).content}

    def _create_image_prompt(self, state: ProductMarketingState) -> ProductMarketingState:
        prompt = f"""
        Create 3 detailed image generation prompts for: {state['product_name']}
        Description: {state['product_description']}
        Target audience: {state['target_audience']}

        For each prompt, describe: product in use, setting, lighting, color palette,
        composition, style, people (if relevant), and emotion.

        PROMPT 1 — Instagram Feed Post (square 1:1):
        - Lifestyle shot, aspirational, warm tones, natural lighting
        - 80-120 words, optimised for DALL-E / Midjourney

        PROMPT 2 — Instagram Story / Reel Cover (vertical 9:16):
        - Dynamic, bold, eye-catching, vibrant colors
        - 80-120 words

        PROMPT 3 — YouTube Thumbnail (landscape 16:9):
        - High contrast, text-friendly composition, expressive
        - 80-120 words

        Label each clearly as PROMPT 1, PROMPT 2, PROMPT 3.
        """
        return {"image_prompt": self._llm.invoke(prompt).content}

    # ── Workflow ─────────────────────────────────────────────────────

    def _build_workflow(self) -> StateGraph:
        wf = StateGraph(ProductMarketingState)
        wf.add_node("research_audience", self._research_audience)
        wf.add_node("analyze_competitors", self._analyze_competitors)
        wf.add_node("facebook", self._create_facebook_content)
        wf.add_node("instagram", self._create_instagram_content)
        wf.add_node("tiktok", self._create_tiktok_content)
        wf.add_node("youtube", self._create_youtube_content)
        wf.add_node("google_ads", self._create_google_ads_content)
        wf.add_node("image_prompt", self._create_image_prompt)

        wf.set_entry_point("research_audience")
        wf.add_edge("research_audience", "analyze_competitors")
        wf.add_edge("analyze_competitors", "facebook")
        wf.add_edge("facebook", "instagram")
        wf.add_edge("instagram", "tiktok")
        wf.add_edge("tiktok", "youtube")
        wf.add_edge("youtube", "google_ads")
        wf.add_edge("google_ads", "image_prompt")
        wf.add_edge("image_prompt", END)
        return wf.compile()

    # ── Strategy interface ───────────────────────────────────────────

    def generate(
        self,
        product_name: str,
        product_description: str,
        target_audience: str,
        unique_selling_points: List[str],
    ) -> Dict[str, Any]:
        result = self._workflow.invoke(
            {
                "product_name": product_name,
                "product_description": product_description,
                "target_audience": target_audience,
                "unique_selling_points": unique_selling_points,
            }
        )
        return {
            "product_info": {
                "name": product_name,
                "description": product_description,
                "target_audience": target_audience,
                "usps": unique_selling_points,
            },
            "research": {
                "audience_insights": result.get("audience_insights", ""),
                "competitor_analysis": result.get("competitor_analysis", ""),
            },
            "content": {
                "facebook": result.get("facebook_post", ""),
                "instagram": result.get("instagram_caption", ""),
                "tiktok": result.get("tiktok_script", ""),
                "youtube": result.get("youtube_description", ""),
                "google_ads": result.get("google_ads_copy", ""),
            },
            "creative": {
                "image_prompt": result.get("image_prompt", ""),
            },
        }

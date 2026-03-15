"""LLMContentStrategy — concrete Strategy (GoF) using any OpenAI-compatible API.

Works with Together.ai, OpenAI, Groq, or any provider that exposes
a /v1/chat/completions endpoint. Model and base URL are fully configurable
via environment variables (AI_MODEL, AI_BASE_URL, AI_API_KEY).
"""

import logging
from typing import List, Dict, Any

import httpx

from app.services.interfaces.content_generator import IContentGenerationStrategy

logger = logging.getLogger(__name__)


class LLMContentStrategy(IContentGenerationStrategy):
    """Generates multi-platform marketing content via an OpenAI-compatible LLM."""

    def __init__(self, api_key: str, base_url: str, model: str):
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._model = model

    def _chat(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1500) -> str:
        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        with httpx.Client(timeout=120) as client:
            resp = client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    # ── LLM nodes ─────────────────────────────────────────────────────

    def _research_audience(self, product_name: str, target_audience: str) -> str:
        return self._chat(f"""
I'm marketing this product: {product_name}
Target audience: {target_audience}

Provide:
1. 3 key pain points of this audience
2. 3 desires/aspirations they have
3. What tone/language resonates with them
4. Which platforms they're most active on

Keep it concise and actionable.
""")

    def _analyze_competitors(self, product_name: str) -> str:
        return self._chat(f"""
For a product like {product_name}, what are common marketing approaches?

Provide:
1. 2-3 common marketing angles competitors use
2. What doesn't work in competitor marketing
3. Opportunity for differentiation

Keep it brief and strategic.
""")

    def _create_facebook(self, product_name: str, description: str, usps: str, insights: str) -> str:
        return self._chat(f"""
Create a Facebook post for: {product_name}
Description: {description}
Benefits: {usps}
Audience insights: {insights}

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
""")

    def _create_instagram(self, product_name: str, description: str, usps: str, insights: str) -> str:
        return self._chat(f"""
Create a VIRAL Instagram caption for: {product_name}
Description: {description}
Benefits: {usps}
Audience insights: {insights}

Instagram caption requirements:
- Length: 50-100 words
- Start with a BOLD hook that stops the scroll (use power words, curiosity gaps, or hot takes)
- Focus on lifestyle/aspiration — make them FEEL something
- Use 3-5 relevant emojis naturally woven in (not clustered)
- Include a question or CTA to encourage comments and saves
- Casual, friendly, authentic, Gen-Z/millennial tone
- End with 10-15 strategic hashtags (mix of trending + niche + branded)
- Make it SHAREABLE — something people would send to a friend
""")

    def _create_tiktok(self, product_name: str, description: str, usps: str, insights: str) -> str:
        return self._chat(f"""
Create a TikTok video script (15-30 seconds) for: {product_name}
Description: {description}
Benefits: {usps}
Audience insights: {insights}

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
""")

    def _create_youtube(self, product_name: str, description: str, usps: str, insights: str) -> str:
        return self._chat(f"""
Create a YouTube video description for: {product_name}
Description: {description}
Benefits: {usps}
Audience insights: {insights}

YouTube description requirements:
- Opening paragraph (2-3 sentences)
- Timestamps with topics
- Detailed product information
- Links section
- About section
- SEO keywords naturally woven in
- 10-15 relevant hashtags at the end
- Professional, informative tone
""")

    def _create_google_ads(self, product_name: str, description: str, usps: str, insights: str) -> str:
        return self._chat(f"""
Create 3 variations of Google Search Ads for: {product_name}
Description: {description}
Benefits: {usps}
Audience insights: {insights}

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
""")

    def _create_image_prompt(self, product_name: str, description: str, target_audience: str) -> str:
        return self._chat(f"""
Create 3 detailed image generation prompts for: {product_name}
Description: {description}
Target audience: {target_audience}

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
""")

    # ── Strategy interface ────────────────────────────────────────────

    def generate(
        self,
        product_name: str,
        product_description: str,
        target_audience: str,
        unique_selling_points: List[str],
    ) -> Dict[str, Any]:
        usps = ", ".join(unique_selling_points)
        logger.info("Generating content for '%s' via %s (%s)", product_name, self._model, self._base_url)

        audience_insights = self._research_audience(product_name, target_audience)
        competitor_analysis = self._analyze_competitors(product_name)

        facebook = self._create_facebook(product_name, product_description, usps, audience_insights)
        instagram = self._create_instagram(product_name, product_description, usps, audience_insights)
        tiktok = self._create_tiktok(product_name, product_description, usps, audience_insights)
        youtube = self._create_youtube(product_name, product_description, usps, audience_insights)
        google_ads = self._create_google_ads(product_name, product_description, usps, audience_insights)
        image_prompt = self._create_image_prompt(product_name, product_description, target_audience)

        return {
            "product_info": {
                "name": product_name,
                "description": product_description,
                "target_audience": target_audience,
                "usps": unique_selling_points,
            },
            "research": {
                "audience_insights": audience_insights,
                "competitor_analysis": competitor_analysis,
            },
            "content": {
                "facebook": facebook,
                "instagram": instagram,
                "tiktok": tiktok,
                "youtube": youtube,
                "google_ads": google_ads,
            },
            "creative": {
                "image_prompt": image_prompt,
            },
        }

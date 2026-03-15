"""Generate images using Together.ai FLUX.1 [schnell] (primary) or
Pollinations.ai (fallback).  Returns base64 data-URLs for the frontend.
"""

import base64
import logging
import time
import urllib.parse
from typing import List, Optional, Tuple

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

TOGETHER_API_URL = "https://api.together.xyz/v1/images/generations"
TOGETHER_TIMEOUT = 60
POLLINATIONS_TIMEOUT = 180
POLLINATIONS_RETRY_DELAY = 20


class ImageGenRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    count: int = 3


class GeneratedImage(BaseModel):
    data_url: str
    prompt: str
    width: int
    height: int


class ImageGenResponse(BaseModel):
    images: List[GeneratedImage]
    recommended_index: int = 0
    errors: List[str] = []
    provider: str = ""


def _generate_via_together(
    prompts: List[str], width: int, height: int
) -> Tuple[List[GeneratedImage], List[str]]:
    from app.core.config import settings
    api_key = settings.effective_image_api_key
    if not api_key:
        return [], ["IMAGE_API_KEY / TOGETHER_API_KEY not configured"]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    images: List[GeneratedImage] = []
    errors: List[str] = []

    for i, prompt in enumerate(prompts):
        payload = {
            "model": settings.IMAGE_MODEL,
            "prompt": prompt,
            "width": width,
            "height": height,
            "steps": 4,
            "n": 1,
            "seed": i * 42 + 1,
            "response_format": "base64",
        }
        logger.info("Together.ai: generating image %d/%d", i + 1, len(prompts))
        try:
            with httpx.Client(timeout=TOGETHER_TIMEOUT, verify=False) as client:
                resp = client.post(TOGETHER_API_URL, json=payload, headers=headers)
            if resp.status_code == 200:
                b64 = resp.json().get("data", [{}])[0].get("b64_json")
                if b64:
                    images.append(GeneratedImage(
                        data_url=f"data:image/jpeg;base64,{b64}",
                        prompt=prompt, width=width, height=height,
                    ))
                    continue
            errors.append(f"Together #{i+1}: HTTP {resp.status_code}")
            logger.warning("Together.ai HTTP %d: %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            errors.append(f"Together #{i+1}: {str(exc)[:60]}")
            logger.warning("Together.ai error: %s", exc)

    return images, errors


def _generate_via_pollinations(
    prompts: List[str], width: int, height: int
) -> Tuple[List[GeneratedImage], List[str]]:
    images: List[GeneratedImage] = []
    errors: List[str] = []

    for i, prompt in enumerate(prompts):
        if i > 0:
            time.sleep(POLLINATIONS_RETRY_DELAY)

        encoded = urllib.parse.quote(prompt)
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width={width}&height={height}&seed={i * 42 + 1}"
        )
        logger.info("Pollinations: generating image %d/%d", i + 1, len(prompts))

        for attempt in range(3):
            try:
                with httpx.Client(timeout=POLLINATIONS_TIMEOUT, follow_redirects=True, verify=False) as client:
                    resp = client.get(url)
                if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image/"):
                    b64 = base64.b64encode(resp.content).decode("ascii")
                    images.append(GeneratedImage(
                        data_url=f"data:image/jpeg;base64,{b64}",
                        prompt=prompt, width=width, height=height,
                    ))
                    break
                if resp.status_code == 429:
                    logger.info("Pollinations 429, waiting %ds (attempt %d)", POLLINATIONS_RETRY_DELAY, attempt + 1)
                    time.sleep(POLLINATIONS_RETRY_DELAY)
                    continue
                errors.append(f"Pollinations #{i+1}: HTTP {resp.status_code}")
                break
            except httpx.TimeoutException:
                errors.append(f"Pollinations #{i+1}: timeout (attempt {attempt+1})")
            except Exception as exc:
                errors.append(f"Pollinations #{i+1}: {str(exc)[:60]}")
                break

    return images, errors


@router.post("/generate-images", response_model=ImageGenResponse)
def generate_images(
    data: ImageGenRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate images. Tries Together.ai first, falls back to Pollinations.ai."""
    styles = [
        "",
        ", professional product photography, studio lighting, clean background",
        ", vibrant social media style, eye-catching colors, modern design",
        ", minimalist aesthetic, soft natural lighting, lifestyle photography",
    ]
    count = min(data.count, 4)
    prompts = [
        data.prompt + (styles[i] if i < len(styles) else "")
        for i in range(count)
    ]

    images, errors = _generate_via_together(prompts, data.width, data.height)
    provider = "together"

    if not images:
        logger.info("Together.ai failed or not configured, trying Pollinations.ai")
        images, poll_errors = _generate_via_pollinations(prompts, data.width, data.height)
        errors.extend(poll_errors)
        provider = "pollinations"

    if not images:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Could not generate images. "
                "Set TOGETHER_API_KEY (free at together.ai) for reliable generation. "
                f"Errors: {'; '.join(errors)}"
            ),
        )

    return ImageGenResponse(
        images=images, recommended_index=0, errors=errors, provider=provider,
    )

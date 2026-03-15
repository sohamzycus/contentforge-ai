"""Parse WhatsApp messages or free-text into structured order items using AI."""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user, get_item_service, get_brand_service
from app.core.config import settings
from app.models.user import User
from app.services.interfaces.item_service import IItemService
from app.services.interfaces.brand_service import IBrandService

logger = logging.getLogger(__name__)

router = APIRouter()


class ParseOrderRequest(BaseModel):
    message: str
    brand_id: int


class ParsedOrderItem(BaseModel):
    item_name: str
    item_id: Optional[int] = None
    quantity: int = 1
    notes: Optional[str] = None
    confidence: float = 1.0


class ParseOrderResponse(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[ParsedOrderItem] = []
    raw_message: str
    source: str = "WHATSAPP"


@router.post("/parse-order", response_model=ParseOrderResponse)
def parse_whatsapp_order(
    data: ParseOrderRequest,
    current_user: User = Depends(get_current_user),
    item_service: IItemService = Depends(get_item_service),
    brand_service: IBrandService = Depends(get_brand_service),
):
    brand = brand_service.get(data.brand_id, current_user.id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

    available_items = item_service.list_by_brand(data.brand_id, include_inactive=False)
    items_catalog = [{"id": i.id, "name": i.name, "category": i.category, "unit": i.unit} for i in available_items]

    try:
        import anthropic
        client = anthropic.Anthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            base_url=settings.ANTHROPIC_BASE_URL,
        )

        prompt = f"""Parse this WhatsApp order message into structured data. Match items to the catalog when possible.

ITEM CATALOG (id, name, category):
{json.dumps(items_catalog, indent=2)}

WHATSAPP MESSAGE:
{data.message}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "customer_name": "name or null",
  "customer_phone": "phone or null",
  "items": [
    {{"item_name": "matched catalog name", "item_id": catalog_id_or_null, "quantity": number, "notes": "special instructions or null", "confidence": 0.0_to_1.0}}
  ]
}}

Rules:
- Match items to catalog by fuzzy name matching. Use the catalog item_id when confident.
- If an item doesn't match any catalog entry, set item_id to null and confidence to 0.5.
- Extract quantity from context (e.g. "2 caesar salad" = quantity 2).
- Extract customer name/phone if mentioned.
- Default quantity is 1 if not specified."""

        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_text = response.content[0].text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        parsed = json.loads(raw_text)

        return ParseOrderResponse(
            customer_name=parsed.get("customer_name"),
            customer_phone=parsed.get("customer_phone"),
            items=[ParsedOrderItem(**item) for item in parsed.get("items", [])],
            raw_message=data.message,
            source="WHATSAPP",
        )

    except json.JSONDecodeError:
        logger.exception("Failed to parse AI response as JSON")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not parse the message into order items")
    except Exception:
        logger.exception("Order parsing failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to parse order message")

"""EventBus — Observer pattern (GoF) for decoupled cross-cutting side effects.

Usage::

    from app.core.events import event_bus

    # Subscribe (typically at app startup)
    event_bus.subscribe("order.delivered", handle_order_delivered)

    # Publish (from service layer)
    event_bus.publish("order.delivered", {"order_id": 42, "brand_id": 2})
"""

import logging
from typing import Any, Callable, Dict, List

logger = logging.getLogger(__name__)


class EventBus:

    def __init__(self) -> None:
        self._handlers: Dict[str, List[Callable[..., Any]]] = {}

    def subscribe(self, event: str, handler: Callable[..., Any]) -> None:
        self._handlers.setdefault(event, []).append(handler)
        logger.debug("Subscribed %s to event '%s'", handler.__name__, event)

    def unsubscribe(self, event: str, handler: Callable[..., Any]) -> None:
        handlers = self._handlers.get(event, [])
        if handler in handlers:
            handlers.remove(handler)

    def publish(self, event: str, data: Any = None) -> None:
        handlers = self._handlers.get(event, [])
        for handler in handlers:
            try:
                handler(data)
            except Exception:
                logger.exception(
                    "Error in handler %s for event '%s'", handler.__name__, event
                )


event_bus = EventBus()

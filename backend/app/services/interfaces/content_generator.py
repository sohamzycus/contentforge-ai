from abc import ABC, abstractmethod
from typing import Dict, Any, List


class IContentGenerationStrategy(ABC):
    """Strategy pattern (GoF) for pluggable content generation backends."""

    @abstractmethod
    def generate(
        self,
        product_name: str,
        product_description: str,
        target_audience: str,
        unique_selling_points: List[str],
    ) -> Dict[str, Any]:
        ...

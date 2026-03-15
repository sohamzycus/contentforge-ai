from abc import ABC, abstractmethod
from datetime import date

from app.schemas.summary import CombinedTriageSummary


class ITriageService(ABC):

    @abstractmethod
    def get_daily_triage(self, user_id: int, target_date: date) -> CombinedTriageSummary:
        ...

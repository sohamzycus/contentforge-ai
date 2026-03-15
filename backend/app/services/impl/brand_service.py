import logging
from typing import List, Optional

from app.core.unit_of_work import IUnitOfWork
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate
from app.services.interfaces.brand_service import IBrandService

logger = logging.getLogger(__name__)


class BrandService(IBrandService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def create(self, user_id: int, data: BrandCreate) -> Brand:
        with self._uow:
            brand = Brand(
                user_id=user_id,
                name=data.name,
                tagline=data.tagline,
                description=data.description,
                type=data.type,
                target_audience=data.target_audience,
                logo_url=data.logo_url,
                instagram_handle=data.instagram_handle,
                whatsapp_link=data.whatsapp_link,
                youtube_channel=data.youtube_channel,
                website_url=data.website_url,
            )
            brand = self._uow.brands.create(brand)
            self._uow.commit()
            self._uow.session.refresh(brand)
            logger.info("Brand created: %s (user=%d)", data.name, user_id)
            return brand

    def list_by_user(self, user_id: int) -> List[Brand]:
        with self._uow:
            return self._uow.brands.get_by_user(user_id)

    def get(self, brand_id: int, user_id: int) -> Optional[Brand]:
        with self._uow:
            return self._uow.brands.get_by_id_and_user(brand_id, user_id)

    def update(self, brand_id: int, user_id: int, data: BrandUpdate) -> Brand:
        with self._uow:
            brand = self._uow.brands.get_by_id_and_user(brand_id, user_id)
            if not brand:
                raise ValueError("Brand not found")
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(brand, field, value)
            self._uow.brands.update(brand)
            self._uow.commit()
            self._uow.session.refresh(brand)
            return brand

    def deactivate(self, brand_id: int, user_id: int) -> None:
        with self._uow:
            brand = self._uow.brands.get_by_id_and_user(brand_id, user_id)
            if not brand:
                raise ValueError("Brand not found")
            brand.is_active = False
            self._uow.brands.update(brand)
            self._uow.commit()
            logger.info("Brand deactivated: %d", brand_id)

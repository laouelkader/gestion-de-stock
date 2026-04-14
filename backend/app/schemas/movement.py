from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.stock_movement import MovementType


class StockMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int = Field(..., description="Entrée/sortie: valeur positive. Ajustement: delta signé.")
    note: str | None = None


class StockMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity_delta: int
    movement_type: MovementType
    note: str | None
    created_at: datetime

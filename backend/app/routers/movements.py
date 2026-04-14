from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MovementType, Product, StockMovement
from app.schemas import StockMovementCreate, StockMovementRead

router = APIRouter(prefix="/movements", tags=["movements"])


def _quantity_to_delta(movement_type: MovementType, quantity: int) -> int:
    if movement_type == MovementType.IN:
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Pour une entrée, la quantité doit être positive.")
        return quantity
    if movement_type == MovementType.OUT:
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Pour une sortie, la quantité doit être positive.")
        return -quantity
    if movement_type == MovementType.ADJUST:
        return quantity
    raise HTTPException(status_code=400, detail="Type de mouvement inconnu.")


@router.get("", response_model=list[StockMovementRead])
def list_movements(
    product_id: int | None = Query(default=None),
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(StockMovement).order_by(StockMovement.created_at.desc())
    if product_id is not None:
        q = q.filter(StockMovement.product_id == product_id)
    return q.offset(skip).limit(limit).all()


@router.post("", response_model=StockMovementRead, status_code=status.HTTP_201_CREATED)
def create_movement(payload: StockMovementCreate, db: Session = Depends(get_db)):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    delta = _quantity_to_delta(payload.movement_type, payload.quantity)
    new_qty = product.quantity + delta
    if new_qty < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuffisant (stock actuel: {product.quantity}, demandé: {-delta}).",
        )

    product.quantity = new_qty
    mov = StockMovement(
        product_id=payload.product_id,
        quantity_delta=delta,
        movement_type=payload.movement_type,
        note=payload.note,
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov

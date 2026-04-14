from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, Product, StockMovement, Supplier
from app.schemas import DashboardStats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    low_stock_count = (
        db.query(func.count(Product.id)).filter(Product.quantity <= Product.reorder_level).scalar() or 0
    )
    total_stock_value = db.query(func.coalesce(func.sum(Product.quantity * Product.unit_price), 0)).scalar()

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    movements_last_7_days = (
        db.query(func.count(StockMovement.id)).filter(StockMovement.created_at >= cutoff).scalar() or 0
    )
    total_categories = db.query(func.count(Category.id)).scalar() or 0
    total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0

    return DashboardStats(
        total_products=total_products,
        low_stock_count=low_stock_count,
        total_stock_value=total_stock_value,
        movements_last_7_days=movements_last_7_days,
        total_categories=total_categories,
        total_suppliers=total_suppliers,
    )

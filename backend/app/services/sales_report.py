from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import MovementType, Product, StockMovement


def resolve_sales_date_range(
    from_date: date | None,
    to_date: date | None,
) -> tuple[date, date]:
    if to_date is None:
        to_date = datetime.now(timezone.utc).date()
    if from_date is None:
        from_date = to_date - timedelta(days=29)
    if from_date > to_date:
        raise ValueError("from_date_after_to")
    return from_date, to_date


def fetch_sales_series(
    db: Session,
    from_date: date,
    to_date: date,
) -> list[tuple[date, int, Decimal]]:
    start = datetime.combine(from_date, time.min, tzinfo=timezone.utc)
    end = datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    day_col = func.date(StockMovement.created_at)

    rows = (
        db.query(
            day_col.label("day"),
            func.sum(func.abs(StockMovement.quantity_delta)).label("units"),
            func.coalesce(
                func.sum(func.abs(StockMovement.quantity_delta) * Product.unit_price),
                0,
            ).label("value"),
        )
        .select_from(StockMovement)
        .join(Product, Product.id == StockMovement.product_id)
        .filter(StockMovement.movement_type == MovementType.OUT)
        .filter(StockMovement.created_at >= start)
        .filter(StockMovement.created_at < end)
        .group_by(day_col)
        .order_by(day_col)
        .all()
    )

    out: list[tuple[date, int, Decimal]] = []
    for r in rows:
        d = r.day
        if isinstance(d, str):
            d = date.fromisoformat(d[:10])
        elif isinstance(d, datetime):
            d = d.date()
        u = int(r.units or 0)
        v = r.value
        if v is None:
            val = Decimal("0")
        elif isinstance(v, Decimal):
            val = v
        else:
            val = Decimal(str(v))
        out.append((d, u, val))
    return out


def fill_daily_series(
    raw: list[tuple[date, int, Decimal]],
    from_date: date,
    to_date: date,
) -> list[tuple[date, int, Decimal]]:
    by_day = {d: (u, v) for d, u, v in raw}
    out: list[tuple[date, int, Decimal]] = []
    d = from_date
    while d <= to_date:
        u, v = by_day.get(d, (0, Decimal("0")))
        out.append((d, u, v))
        d += timedelta(days=1)
    return out

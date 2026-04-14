from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products: int
    low_stock_count: int
    total_stock_value: Decimal
    movements_last_7_days: int
    total_categories: int
    total_suppliers: int

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class SalesDayPoint(BaseModel):
    day: date
    units: int = Field(ge=0)
    value: Decimal = Field(ge=0)


class SalesReportTotals(BaseModel):
    units: int = Field(ge=0)
    value: Decimal = Field(ge=0)


class SalesReportRead(BaseModel):
    from_date: date
    to_date: date
    series: list[SalesDayPoint]
    totals: SalesReportTotals
    note: str = (
        "Les ventes sont déduites des mouvements de type « sortie ». "
        "Le montant utilise le prix unitaire actuel de chaque produit."
    )

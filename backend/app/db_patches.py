"""Mises à jour légères pour SQLite (colonnes manquantes après évolution des modèles)."""

from sqlalchemy import inspect, text

from app.config import settings


def apply_sqlite_patches(engine) -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    insp = inspect(engine)
    tables = insp.get_table_names()
    with engine.begin() as conn:
        if "products" in tables:
            cols = {c["name"] for c in insp.get_columns("products")}
            if "supplier_id" not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN supplier_id INTEGER"))

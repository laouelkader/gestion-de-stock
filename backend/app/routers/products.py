import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, Product, Supplier
from app.schemas import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    category_id: int | None = None,
    low_stock_only: bool = False,
    q: str | None = Query(default=None, min_length=1, description="Recherche nom ou SKU"),
    db: Session = Depends(get_db),
):
    query = db.query(Product).order_by(Product.name)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if low_stock_only:
        query = query.filter(Product.quantity <= Product.reorder_level)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(Product.name.ilike(term), Product.sku.ilike(term)))
    return query.all()


@router.get("/export/csv")
def export_products_csv(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.name).all()
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";")
    writer.writerow(
        ["id", "sku", "name", "quantity", "reorder_level", "unit_price", "category_id", "supplier_id"],
    )
    for p in products:
        writer.writerow(
            [
                p.id,
                p.sku,
                p.name,
                p.quantity,
                p.reorder_level,
                str(p.unit_price),
                p.category_id if p.category_id is not None else "",
                p.supplier_id if p.supplier_id is not None else "",
            ],
        )
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="produits.csv"'},
    )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="Un produit avec ce SKU existe déjà.")
    if payload.category_id is not None and db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=400, detail="Catégorie invalide.")
    if payload.supplier_id is not None and db.get(Supplier, payload.supplier_id) is None:
        raise HTTPException(status_code=400, detail="Fournisseur invalide.")
    p = Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    return p


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    data = payload.model_dump(exclude_unset=True)
    if "sku" in data and data["sku"] != p.sku:
        if db.query(Product).filter(Product.sku == data["sku"]).first():
            raise HTTPException(status_code=400, detail="Un produit avec ce SKU existe déjà.")
    if data.get("category_id") is not None and db.get(Category, data["category_id"]) is None:
        raise HTTPException(status_code=400, detail="Catégorie invalide.")
    if data.get("supplier_id") is not None and db.get(Supplier, data["supplier_id"]) is None:
        raise HTTPException(status_code=400, detail="Fournisseur invalide.")
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    db.delete(p)
    db.commit()
    return None

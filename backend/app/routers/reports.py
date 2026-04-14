import io
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SalesDayPoint, SalesReportRead, SalesReportTotals
from app.services.sales_report import (
    fetch_sales_series,
    fill_daily_series,
    resolve_sales_date_range,
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _build_report(db: Session, from_date: date | None, to_date: date | None) -> SalesReportRead:
    try:
        fd, td = resolve_sales_date_range(from_date, to_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="La date de début doit être antérieure à la date de fin.")
    raw = fetch_sales_series(db, fd, td)
    filled = fill_daily_series(raw, fd, td)
    series = [SalesDayPoint(day=d, units=u, value=v.quantize(Decimal("0.01"))) for d, u, v in filled]
    total_u = sum(p.units for p in series)
    total_v = sum((p.value for p in series), Decimal("0")).quantize(Decimal("0.01"))
    return SalesReportRead(
        from_date=fd,
        to_date=td,
        series=series,
        totals=SalesReportTotals(units=total_u, value=total_v),
    )


@router.get("/sales", response_model=SalesReportRead)
def sales_report(
    from_date: date | None = Query(default=None, description="Début (inclus), défaut : 30 derniers jours"),
    to_date: date | None = Query(default=None, description="Fin (inclus)"),
    db: Session = Depends(get_db),
):
    return _build_report(db, from_date, to_date)


@router.get("/sales/pdf")
def sales_report_pdf(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    rep = _build_report(db, from_date, to_date)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="Rapport des ventes",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="TitleFR",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=12,
    )
    small = ParagraphStyle(name="Small", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    story: list = []
    story.append(Paragraph("Rapport des ventes (sorties de stock)", title_style))
    story.append(
        Paragraph(
            f"Période : du <b>{rep.from_date.isoformat()}</b> au <b>{rep.to_date.isoformat()}</b>",
            styles["Normal"],
        ),
    )
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(rep.note, small))
    story.append(Spacer(1, 0.5 * cm))

    data = [["Date", "Quantité vendue (unités)", "Montant (€)"]]
    for p in rep.series:
        data.append(
            [
                p.day.isoformat(),
                str(p.units),
                f"{p.value:.2f}".replace(".", ","),
            ],
        )
    data.append(
        [
            "Total",
            str(rep.totals.units),
            f"{rep.totals.value:.2f}".replace(".", ","),
        ],
    )

    table = Table(data, colWidths=[4 * cm, 5 * cm, 4 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d9488")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
            ],
        ),
    )
    story.append(table)
    story.append(Spacer(1, 0.8 * cm))
    story.append(
        Paragraph(
            "Document généré automatiquement — les montants sont indicatifs (prix unitaire actuel).",
            small,
        ),
    )

    doc.build(story)
    buf.seek(0)
    fname = f"ventes_{rep.from_date.isoformat()}_{rep.to_date.isoformat()}.pdf"
    return Response(
        content=buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )

"""
ThreatMatrix AI — PDF Report Generator

Per MASTER_DOC_PART5 Week 6:
  "PDF report generation (ReportLab) — Daily threat summary PDF"

Generates branded PDF reports with:
  - Executive summary with threat level
  - Alert breakdown by severity
  - Top threats and IOC matches
  - ML model performance summary
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)

# ── Brand Colors ──────────────────────────────────────────────────
BRAND_PRIMARY = colors.HexColor("#1a73e8")
BRAND_DARK = colors.HexColor("#1a1a2e")
BRAND_ACCENT = colors.HexColor("#e94560")
BRAND_LIGHT_BG = colors.HexColor("#f0f4ff")

REPORTS_DIR = Path("/app/reports")


def _build_styles() -> Dict[str, ParagraphStyle]:
    """Build branded paragraph styles."""
    base = getSampleStyleSheet()

    return {
        "title": ParagraphStyle(
            "TMTitle",
            parent=base["Title"],
            fontSize=22,
            textColor=BRAND_DARK,
            spaceAfter=6,
            alignment=TA_CENTER,
        ),
        "subtitle": ParagraphStyle(
            "TMSubtitle",
            parent=base["Normal"],
            fontSize=11,
            textColor=colors.gray,
            spaceAfter=20,
            alignment=TA_CENTER,
        ),
        "heading": ParagraphStyle(
            "TMHeading",
            parent=base["Heading2"],
            fontSize=14,
            textColor=BRAND_PRIMARY,
            spaceBefore=16,
            spaceAfter=8,
            borderWidth=0,
            borderPadding=0,
        ),
        "body": ParagraphStyle(
            "TMBody",
            parent=base["Normal"],
            fontSize=10,
            textColor=BRAND_DARK,
            spaceAfter=6,
            leading=14,
        ),
        "metric_value": ParagraphStyle(
            "TMMetric",
            parent=base["Normal"],
            fontSize=12,
            textColor=BRAND_PRIMARY,
            alignment=TA_CENTER,
        ),
        "metric_label": ParagraphStyle(
            "TMMetricLabel",
            parent=base["Normal"],
            fontSize=8,
            textColor=colors.gray,
            alignment=TA_CENTER,
        ),
    }


def _header_footer(canvas: Any, doc: Any) -> None:
    """Draw branded header and footer on each page."""
    canvas.saveState()

    # Header bar
    canvas.setFillColor(BRAND_PRIMARY)
    canvas.rect(0, A4[1] - 40, A4[0], 40, fill=True, stroke=False)

    # Header text
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(30, A4[1] - 28, "ThreatMatrix AI")

    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(
        A4[0] - 30, A4[1] - 28, "Network Anomaly Detection Platform"
    )

    # Footer
    canvas.setFillColor(colors.gray)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(
        30,
        20,
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    )
    canvas.drawRightString(
        A4[0] - 20, 20, f"Page {doc.page} — Confidential"
    )

    canvas.restoreState()


def _build_alert_table(
    alert_stats: List[Dict[str, Any]], styles: Dict[str, ParagraphStyle]
) -> List[Any]:
    """Build alert summary table."""
    elements: List[Any] = []

    elements.append(Paragraph("Alert Summary", styles["heading"]))

    if not alert_stats:
        elements.append(Paragraph("No alerts in the reporting period.", styles["body"]))
        return elements

    # Severity color mapping
    sev_colors = {
        "critical": colors.HexColor("#d32f2f"),
        "high": colors.HexColor("#f57c00"),
        "medium": colors.HexColor("#fbc02d"),
        "low": colors.HexColor("#388e3c"),
        "info": colors.HexColor("#1976d2"),
    }

    header = [
        Paragraph("<b>Severity</b>", styles["body"]),
        Paragraph("<b>Count</b>", styles["body"]),
        Paragraph("<b>Status</b>", styles["body"]),
    ]
    data = [header]

    total = 0
    for stat in alert_stats:
        sev = stat.get("severity", "unknown")
        cnt = stat.get("count", 0)
        total += cnt
        sev_color = sev_colors.get(sev, colors.gray)
        data.append(
            [
                Paragraph(
                    f'<font color="{sev_color.hexval()}">{sev.upper()}</font>',
                    styles["body"],
                ),
                Paragraph(str(cnt), styles["body"]),
                Paragraph("Active" if sev in ("critical", "high") else "Monitoring", styles["body"]),
            ]
        )

    # Total row
    data.append(
        [
            Paragraph("<b>TOTAL</b>", styles["body"]),
            Paragraph(f"<b>{total}</b>", styles["body"]),
            Paragraph("", styles["body"]),
        ]
    )

    table = Table(data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, -1), (-1, -1), BRAND_LIGHT_BG),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, BRAND_LIGHT_BG]),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 12))

    return elements


def _build_flow_stats(
    flow_stats: Dict[str, Any], styles: Dict[str, ParagraphStyle]
) -> List[Any]:
    """Build flow statistics section."""
    elements: List[Any] = []
    elements.append(Paragraph("Network Flow Statistics", styles["heading"]))

    total = flow_stats.get("total_flows", 0)
    anomalous = flow_stats.get("anomalous_flows", 0)
    avg_score = flow_stats.get("avg_anomaly_score", 0.0)
    anomaly_pct = (anomalous / total * 100) if total > 0 else 0.0

    metrics_data = [
        [
            Paragraph(f"<b>{total:,}</b>", styles["metric_value"]),
            Paragraph(f"<b>{anomalous:,}</b>", styles["metric_value"]),
            Paragraph(f"<b>{anomaly_pct:.1f}%</b>", styles["metric_value"]),
            Paragraph(f"<b>{avg_score:.4f}</b>", styles["metric_value"]),
        ],
        [
            Paragraph("Total Flows", styles["metric_label"]),
            Paragraph("Anomalous", styles["metric_label"]),
            Paragraph("Anomaly Rate", styles["metric_label"]),
            Paragraph("Avg Score", styles["metric_label"]),
        ],
    ]

    metrics_table = Table(
        metrics_data, colWidths=[1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch]
    )
    metrics_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 1, BRAND_PRIMARY),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.lightgrey),
            ]
        )
    )

    elements.append(metrics_table)
    elements.append(Spacer(1, 12))

    return elements


def _build_ioc_summary(
    ioc_stats: List[Dict[str, Any]], styles: Dict[str, ParagraphStyle]
) -> List[Any]:
    """Build IOC summary section."""
    elements: List[Any] = []
    elements.append(Paragraph("Threat Intelligence Summary", styles["heading"]))

    if not ioc_stats:
        elements.append(Paragraph("No active IOCs in database.", styles["body"]))
        return elements

    header = [
        Paragraph("<b>IOC Type</b>", styles["body"]),
        Paragraph("<b>Active Count</b>", styles["body"]),
    ]
    data = [header]

    total_iocs = 0
    for stat in ioc_stats:
        ioc_type = stat.get("type", "unknown")
        count = stat.get("count", 0)
        total_iocs += count
        data.append(
            [
                Paragraph(ioc_type.upper(), styles["body"]),
                Paragraph(f"{count:,}", styles["body"]),
            ]
        )

    data.append(
        [
            Paragraph("<b>TOTAL</b>", styles["body"]),
            Paragraph(f"<b>{total_iocs:,}</b>", styles["body"]),
        ]
    )

    table = Table(data, colWidths=[3 * inch, 3 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BACKGROUND", (0, -1), (-1, -1), BRAND_LIGHT_BG),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 12))

    return elements


def _build_ml_summary(
    ml_data: Dict[str, Any], styles: Dict[str, ParagraphStyle]
) -> List[Any]:
    """Build ML model performance summary section."""
    elements: List[Any] = []
    elements.append(Paragraph("ML Model Status", styles["heading"]))

    models = ml_data.get("models", [])
    if not models:
        elements.append(Paragraph("No model data available.", styles["body"]))
        return elements

    header = [
        Paragraph("<b>Model</b>", styles["body"]),
        Paragraph("<b>Type</b>", styles["body"]),
        Paragraph("<b>Status</b>", styles["body"]),
    ]
    data = [header]

    for model in models:
        data.append(
            [
                Paragraph(model.get("name", "unknown"), styles["body"]),
                Paragraph(model.get("type", "unknown"), styles["body"]),
                Paragraph(model.get("status", "unknown"), styles["body"]),
            ]
        )

    table = Table(data, colWidths=[2.5 * inch, 2 * inch, 1.5 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG]),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 12))

    return elements


def generate_pdf_report(
    report_type: str,
    report_data: Dict[str, Any],
    title: str,
    report_id: str,
) -> Path:
    """
    Generate a branded PDF report.

    Args:
        report_type: Type of report (daily_summary, executive, etc.)
        report_data: Gathered report data dict.
        title: Report title.
        report_id: Unique report identifier.

    Returns:
        Path to the generated PDF file.
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = REPORTS_DIR / f"{report_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        topMargin=60,
        bottomMargin=40,
        leftMargin=30,
        rightMargin=30,
    )

    styles = _build_styles()
    elements: List[Any] = []

    # Title section
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(title, styles["title"]))
    elements.append(
        Paragraph(
            f"Report Type: {report_type.replace('_', ' ').title()} | "
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            styles["subtitle"],
        )
    )

    # Executive Summary
    elements.append(Paragraph("Executive Summary", styles["heading"]))
    alert_stats = report_data.get("alert_stats", [])
    total_alerts = sum(s.get("count", 0) for s in alert_stats)
    critical = next(
        (s["count"] for s in alert_stats if s.get("severity") == "critical"), 0
    )
    high = next(
        (s["count"] for s in alert_stats if s.get("severity") == "high"), 0
    )

    threat_level = "NORMAL"
    if critical > 0:
        threat_level = "CRITICAL"
    elif high > 5:
        threat_level = "HIGH"
    elif total_alerts > 10:
        threat_level = "ELEVATED"

    elements.append(
        Paragraph(
            f"Current threat level: <b>{threat_level}</b>. "
            f"Total alerts in period: <b>{total_alerts}</b>. "
            f"Critical: <b>{critical}</b>, High: <b>{high}</b>.",
            styles["body"],
        )
    )
    elements.append(Spacer(1, 8))

    # Alert Summary Table
    elements.extend(_build_alert_table(alert_stats, styles))

    # Flow Statistics
    flow_stats = report_data.get("flow_stats", {})
    if flow_stats:
        elements.extend(_build_flow_stats(flow_stats, styles))

    # IOC Summary
    ioc_stats = report_data.get("ioc_stats", [])
    if ioc_stats:
        elements.extend(_build_ioc_summary(ioc_stats, styles))

    # ML Model Status
    models = report_data.get("models", [])
    if models:
        elements.extend(_build_ml_summary({"models": models}, styles))

    # Alert Response (compliance)
    alert_response = report_data.get("alert_response", {})
    if alert_response:
        elements.append(Paragraph("Alert Response Metrics", styles["heading"]))
        elements.append(
            Paragraph(
                f"Resolution rate: <b>{alert_response.get('resolution_rate', 0)}%</b>. "
                f"Resolved: <b>{alert_response.get('resolved', 0)}</b>, "
                f"Open: <b>{alert_response.get('open', 0)}</b>, "
                f"Investigating: <b>{alert_response.get('investigating', 0)}</b>.",
                styles["body"],
            )
        )
        elements.append(Spacer(1, 12))

    # Build PDF
    doc.build(elements, onFirstPage=_header_footer, onLaterPages=_header_footer)
    logger.info("[PDF] Report generated: %s (%d bytes)", pdf_path, pdf_path.stat().st_size)

    return pdf_path

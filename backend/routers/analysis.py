"""Analysis router — image forensics, deepfake detection, log analysis, PDF report, AI assistant."""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from backend.database import get_db
from backend.models import Evidence, AnalysisResult, Case
from backend.schemas import AnalysisResultOut, AssistantQuery, AssistantResponse
from backend.routers.auth import get_current_user
from backend.models import User
from backend.ai_engine import (
    run_image_forensics, run_deepfake_detection, run_log_analysis,
    ask_assistant, analyze_text_evidence, generate_case_summary
)

router = APIRouter()


def _get_evidence_or_404(evidence_id: int, db: Session) -> Evidence:
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(404, "Evidence not found")
    return ev


def _save_result(db: Session, evidence_id: int, module: str, data: dict) -> AnalysisResult:
    # Upsert — remove old result for this evidence + module
    existing = db.query(AnalysisResult).filter(
        AnalysisResult.evidence_id == evidence_id,
        AnalysisResult.module == module,
    ).first()
    if existing:
        db.delete(existing)

    ar = AnalysisResult(
        evidence_id = evidence_id,
        module      = module,
        result      = json.dumps(data["result"]),
        risk_score  = data["risk_score"],
    )
    db.add(ar)
    db.commit()
    db.refresh(ar)
    return ar


@router.post("/image-forensics/{evidence_id}", response_model=AnalysisResultOut)
def image_forensics(evidence_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    ev   = _get_evidence_or_404(evidence_id, db)
    data = run_image_forensics(ev.file_path)
    ar   = _save_result(db, evidence_id, "image_forensics", data)
    return _format_result(ar)


@router.post("/deepfake/{evidence_id}", response_model=AnalysisResultOut)
def deepfake_detection(evidence_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    ev   = _get_evidence_or_404(evidence_id, db)
    data = run_deepfake_detection(ev.file_path)
    ar   = _save_result(db, evidence_id, "deepfake_detection", data)
    return _format_result(ar)


@router.post("/log-analysis/{evidence_id}", response_model=AnalysisResultOut)
def log_analysis(evidence_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    ev   = _get_evidence_or_404(evidence_id, db)
    data = run_log_analysis(ev.file_path)
    ar   = _save_result(db, evidence_id, "log_analysis", data)
    return _format_result(ar)


@router.get("/result/{evidence_id}", response_model=AnalysisResultOut)
def get_result(evidence_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    ar = db.query(AnalysisResult).filter(AnalysisResult.evidence_id == evidence_id).order_by(AnalysisResult.created_at.desc()).first()
    if not ar:
        raise HTTPException(404, "No analysis result found")
    return _format_result(ar)


def _format_result(ar: AnalysisResult) -> dict:
    return {
        "id":          ar.id,
        "evidence_id": ar.evidence_id,
        "module":      ar.module,
        "result":      json.loads(ar.result) if isinstance(ar.result, str) else ar.result,
        "risk_score":  ar.risk_score,
        "created_at":  ar.created_at,
    }


from fastapi import Header

@router.post("/assistant", response_model=AssistantResponse)
def ai_assistant(
    query: AssistantQuery, 
    x_api_key: str = Header(None),
    current: User = Depends(get_current_user)
):
    response = ask_assistant(query.question, query.context or "", api_key=x_api_key)
    return AssistantResponse(response=response)


@router.post("/text-analyze")
def text_analyze(
    payload: dict,
    x_api_key: str = Header(None),
    current: User = Depends(get_current_user),
):
    """Analyze raw text/notes for forensic threats using Gemini AI."""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(400, "No text provided")
    result = analyze_text_evidence(text, api_key=x_api_key)
    return result


@router.get("/case-summary/{case_id}")
def case_ai_summary(
    case_id: int,
    x_api_key: str = Header(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Generate an AI-powered executive summary for a case."""
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    ev_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    results = db.query(AnalysisResult).join(Evidence).filter(Evidence.case_id == case_id).all()
    max_risk = max((r.risk_score for r in results), default=0)

    case_data = {
        "title": case.title,
        "case_id": case.case_id,
        "status": case.status,
        "priority": case.priority,
        "evidence_count": len(ev_list),
        "max_risk": max_risk,
        "analysis_summary": f"{len(results)} analysis module(s) run" if results else "No analysis yet",
    }
    summary = generate_case_summary(case_data, api_key=x_api_key)
    return {"case_id": case_id, "summary": summary, "max_risk": max_risk}


@router.get("/stats")
def global_stats(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Return global analysis statistics for the dashboard."""
    total_results = db.query(AnalysisResult).join(Evidence).join(Case).filter(
        Case.owner_id == current.id
    ).all()

    high_risk = sum(1 for r in total_results if r.risk_score >= 70)
    medium_risk = sum(1 for r in total_results if 40 <= r.risk_score < 70)
    low_risk = sum(1 for r in total_results if r.risk_score < 40)
    avg_risk = round(sum(r.risk_score for r in total_results) / len(total_results), 1) if total_results else 0

    modules: dict = {}
    for r in total_results:
        modules[r.module] = modules.get(r.module, 0) + 1

    return {
        "total_analyses": len(total_results),
        "high_risk_count": high_risk,
        "medium_risk_count": medium_risk,
        "low_risk_count": low_risk,
        "average_risk_score": avg_risk,
        "modules_breakdown": modules,
    }


@router.get("/report/{case_id}")
def generate_report(case_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    """Generate a professional PDF forensic report for a case."""
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()

        # Custom styles
        DARK = colors.HexColor("#0a0f1e")
        CYAN = colors.HexColor("#00d4ff")
        RED  = colors.HexColor("#ff3366")

        title_style = ParagraphStyle("Title", parent=styles["Title"],  fontSize=22, textColor=colors.white,      backColor=DARK, alignment=TA_CENTER, spaceAfter=6)
        h1_style    = ParagraphStyle("H1",    parent=styles["Heading1"], fontSize=14, textColor=CYAN,             spaceBefore=12, spaceAfter=6)
        body_style  = ParagraphStyle("Body",  parent=styles["Normal"],   fontSize=10, textColor=colors.HexColor("#94a3b8"), spaceAfter=4)
        mono_style  = ParagraphStyle("Mono",  parent=styles["Code"],     fontSize=8,  textColor=colors.HexColor("#00d4ff"), backColor=colors.HexColor("#050810"), spaceAfter=4)

        story = []

        # Cover
        story.append(Paragraph("NEXUSDFI FORENSIC REPORT", title_style))
        story.append(Paragraph("CONFIDENTIAL — FOR LAW ENFORCEMENT USE ONLY", ParagraphStyle("sub", parent=styles["Normal"], fontSize=9, textColor=RED, alignment=TA_CENTER)))
        story.append(HRFlowable(width="100%", thickness=1, color=CYAN))
        story.append(Spacer(1, 8*mm))

        # Case details table
        ev_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        results = db.query(AnalysisResult).join(Evidence).filter(Evidence.case_id == case_id).all()
        max_risk = max((r.risk_score for r in results), default=0)
        risk_label = "CRITICAL" if max_risk >= 80 else "HIGH" if max_risk >= 60 else "MEDIUM" if max_risk >= 40 else "LOW"

        meta_data = [
            ["Case Reference",   case.case_id],
            ["Investigation",    case.title],
            ["Status",           case.status],
            ["Priority",         case.priority],
            ["Evidence Items",   str(len(ev_list))],
            ["Overall Risk",     f"{risk_label} ({max_risk}/100)"],
            ["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
            ["Investigator",     current.username],
        ]
        t = Table(meta_data, colWidths=[50*mm, 110*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,-1), colors.HexColor("#0a0f1e")),
            ("TEXTCOLOR",   (0,0), (0,-1),  colors.HexColor("#475569")),
            ("TEXTCOLOR",   (1,0), (1,-1),  colors.white),
            ("FONTNAME",    (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",    (0,0), (-1,-1), 9),
            ("GRID",        (0,0), (-1,-1), 0.5, colors.HexColor("#1e2d4a")),
            ("ROWBACKGROUNDS",(0,0),(-1,-1),[colors.HexColor("#0a0f1e"), colors.HexColor("#0f1629")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 8*mm))

        # Executive Summary
        story.append(Paragraph("EXECUTIVE SUMMARY", h1_style))
        story.append(Paragraph(
            f"This forensic report documents the investigation of case {case.case_id} — \"{case.title}\". "
            f"A total of {len(ev_list)} evidence items were collected and analyzed using NexusDFI's AI-powered "
            f"forensics pipeline. The overall risk assessment is <b>{risk_label}</b> with a peak score of {max_risk}/100.",
            body_style
        ))
        story.append(Spacer(1, 6*mm))

        # Evidence inventory
        story.append(Paragraph("EVIDENCE INVENTORY", h1_style))
        for ev in ev_list:
            story.append(Paragraph(f"• <b>{ev.filename}</b> ({ev.file_type.upper()}) — Uploaded: {ev.uploaded_at.strftime('%Y-%m-%d %H:%M UTC')}", body_style))
            story.append(Paragraph(f"  SHA-256: {ev.sha256_hash}", mono_style))

        story.append(Spacer(1, 6*mm))

        # Analysis findings
        story.append(Paragraph("FORENSIC FINDINGS", h1_style))
        if results:
            for ar in results:
                ev = db.query(Evidence).filter(Evidence.id == ar.evidence_id).first()
                result_data = json.loads(ar.result) if isinstance(ar.result, str) else ar.result
                story.append(Paragraph(f"{ar.module.replace('_',' ').title()} — {ev.filename if ev else 'Unknown'}", ParagraphStyle("sub_h", parent=styles["Heading2"], fontSize=11, textColor=colors.HexColor("#7b2fff"))))
                story.append(Paragraph(f"Risk Score: {ar.risk_score}/100 | {result_data.get('summary','')}", body_style))
                for f in result_data.get("findings", [])[:5]:
                    story.append(Paragraph(f"  [{f.get('severity','?')}] {f.get('category','')}: {f.get('description','')}", body_style))
                story.append(Spacer(1, 4*mm))
        else:
            story.append(Paragraph("No analysis results available for this case.", body_style))

        story.append(Spacer(1, 6*mm))

        # Recommendations
        story.append(Paragraph("RECOMMENDATIONS", h1_style))
        recs = [
            "Preserve all evidence with documented chain-of-custody before any court proceedings.",
            "Submit physical storage media to a certified digital forensics laboratory for verification.",
            "Escalate critical findings to Tier-2 SOC and legal counsel immediately.",
            "Implement enhanced monitoring on all systems involved in this investigation.",
            "Review and update access control policies based on findings.",
        ]
        for rec in recs:
            story.append(Paragraph(f"• {rec}", body_style))

        story.append(Spacer(1, 8*mm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#1e2d4a")))
        story.append(Paragraph("This report was generated by NexusDFI v2.5.0. All findings should be independently verified by a qualified forensics professional before use in legal proceedings.", ParagraphStyle("footer", parent=styles["Normal"], fontSize=7, textColor=colors.HexColor("#475569"), alignment=TA_CENTER)))

        doc.build(story)
        buf.seek(0)

        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{case.case_id}_report.pdf"'},
        )

    except ImportError:
        raise HTTPException(500, "reportlab not installed. Run: pip install reportlab")

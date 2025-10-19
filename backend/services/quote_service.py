from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from backend.models.quote import Quote
from backend.repositories.quote_repository import create_quote
from backend.schemas.quote import QuoteCreate, QuotePreview


def _estimate_total(capacity: int, budget: Optional[float]) -> float:
    base = capacity * 150.0
    if budget:
        return round(min(max(base, budget * 10000), budget * 12000), 2)
    return round(base, 2)


def _generate_highlights(request: QuoteCreate) -> str:
    highlights = [
        f"产线配置满足 {request.capacity} 瓶/小时产能",
        f"适配 {request.bottleType} 包装规格"
    ]
    if request.launchDate:
        highlights.append(f"预计 {request.launchDate.strftime('%Y年%m月')} 可完成联调交付")
    if len(request.requirements) > 30:
        highlights.append("已根据重点需求生成多模块集成方案")
    return "；".join(highlights)


def create_quote_preview(db: Session, payload: QuoteCreate) -> QuotePreview:
    estimated_total = _estimate_total(payload.capacity, payload.budget)
    highlights = _generate_highlights(payload)

    quote = Quote(
        client_name=payload.clientName,
        capacity=payload.capacity,
        bottle_type=payload.bottleType,
        launch_date=payload.launchDate,
        budget=payload.budget,
        requirements=payload.requirements,
        highlights=highlights,
        estimated_total=estimated_total,
        created_at=datetime.utcnow()
    )
    stored = create_quote(db, quote)
    return QuotePreview(
        clientName=stored.client_name,
        highlights=stored.highlights,
        estimatedTotal=stored.estimated_total
    )

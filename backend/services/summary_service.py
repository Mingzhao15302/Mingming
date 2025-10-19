import json
from datetime import date, datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from backend.models.quote import Quote
from backend.models.sales_log import SalesLog
from backend.models.summary_snapshot import SummarySnapshot
from backend.repositories.log_repository import get_logs_between
from backend.repositories.summary_repository import get_snapshot, save_snapshot
from backend.schemas.summary import SummaryResponse


def _month_start(target: date) -> date:
    return target.replace(day=1)


def _month_range(month: date) -> List[date]:
    start = _month_start(month)
    if start.month == 12:
        next_month = start.replace(year=start.year + 1, month=1, day=1)
    else:
        next_month = start.replace(month=start.month + 1, day=1)
    end = next_month - timedelta(days=1)
    return [start, end]


def _serialize(snapshot: SummarySnapshot) -> SummaryResponse:
    return SummaryResponse(
        month=f"{snapshot.month.year}年{snapshot.month.month}月",
        generatedAt=snapshot.generated_at.strftime('%Y-%m-%d %H:%M'),
        coreProgress=snapshot.core_progress,
        keyAccounts=json.loads(snapshot.key_accounts_json),
        nextSteps=snapshot.next_steps
    )


def _build_summary(month: date, logs: List[SalesLog], quotes: List[Quote]) -> SummarySnapshot:
    start, _ = _month_range(month)
    log_count = len(logs)
    quote_count = len(quotes)
    total_amount = sum(q.estimated_total or 0 for q in quotes)

    key_accounts = []
    for log in logs:
        if log.title not in key_accounts:
            key_accounts.append(log.title)
        if len(key_accounts) >= 5:
            break
    if not key_accounts:
        key_accounts = ['待录入']

    core_progress = (
        f"本月累计记录 {log_count} 条销售动态，新增报价 {quote_count} 份，预计合同金额 ¥{round(total_amount, 2)}。"
    )
    next_steps = (
        "聚焦重点客户推进签约，完善产线验收方案，并持续回访意向客户获取一手反馈。"
    )

    return SummarySnapshot(
        month=start,
        core_progress=core_progress,
        key_accounts_json=json.dumps(key_accounts, ensure_ascii=False),
        next_steps=next_steps,
        generated_at=datetime.utcnow()
    )


def get_monthly_summary(db: Session, refresh: bool = False) -> SummaryResponse:
    today = date.today()
    start, end = _month_range(today)

    snapshot = None if refresh else get_snapshot(db, start)
    if snapshot and not refresh:
        return _serialize(snapshot)

    logs = get_logs_between(db, start, end)
    quotes = (
        db.query(Quote)
        .filter(Quote.created_at >= start, Quote.created_at <= end)
        .all()
    )

    snapshot = _build_summary(today, logs, quotes)
    snapshot = save_snapshot(db, snapshot)
    return _serialize(snapshot)

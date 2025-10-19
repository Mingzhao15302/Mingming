from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session

from backend.models.quote import Quote
from backend.models.sales_log import SalesLog
from backend.schemas.dashboard import DashboardOverview, TodoItem


def _build_todos(logs: List[SalesLog]) -> List[TodoItem]:
    todos: List[TodoItem] = []
    icon_cycle = ['📞', '💬', '📝', '🚚']
    for index, log in enumerate(logs[:3]):
        todos.append(
            TodoItem(
                title=log.title,
                subtitle=f"时间：{log.time}",
                icon=icon_cycle[index % len(icon_cycle)]
            )
        )
    if not todos:
        todos.append(TodoItem(title='创建首条销售跟进', subtitle='保持客户沟通节奏', icon='⚡️'))
    return todos


def get_dashboard_overview(db: Session) -> DashboardOverview:
    today = date.today()
    month_start = today.replace(day=1)
    quotes = (
        db.query(Quote)
        .filter(Quote.created_at >= month_start)
        .all()
    )
    logs = (
        db.query(SalesLog)
        .filter(SalesLog.log_date == today)
        .all()
    )

    leads = len(quotes) or 0
    total_amount = sum(q.estimated_total or 0 for q in quotes)
    pending = max(1, leads // 2) if leads else 0
    trend = f"+{leads * 3}%" if leads else '+0%'

    return DashboardOverview(
        leads=leads,
        leadsTrend=trend,
        contractAmount=round(total_amount, 2),
        pendingContracts=pending,
        todos=_build_todos(logs)
    )

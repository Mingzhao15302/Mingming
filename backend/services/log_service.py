from datetime import date, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session

from backend.models.sales_log import SalesLog
from backend.repositories.log_repository import get_logs_between, get_logs_by_date
from backend.schemas.log import CalendarResponse, CalendarData, CalendarDay, LogListResponse, SalesLogItem


def _start_of_calendar(month_start: date) -> date:
    weekday = month_start.weekday()  # Monday=0
    offset = (weekday + 1) % 7
    return month_start - timedelta(days=offset)


def _group_logs(logs: List[SalesLog]) -> Dict[date, List[SalesLog]]:
    grouped: Dict[date, List[SalesLog]] = {}
    for log in logs:
        grouped.setdefault(log.log_date, []).append(log)
    return grouped


def _serialize_logs(logs: List[SalesLog]) -> List[SalesLogItem]:
    return [
        SalesLogItem(id=log.id, title=log.title, time=log.time, content=log.content)
        for log in logs
    ]


def get_calendar_overview(db: Session) -> CalendarResponse:
    today = date.today()
    month_start = today.replace(day=1)
    calendar_start = _start_of_calendar(month_start)
    calendar_end = calendar_start + timedelta(days=41)

    logs = get_logs_between(db, calendar_start, calendar_end)
    grouped = _group_logs(logs)

    days: List[CalendarDay] = []
    current = calendar_start
    for _ in range(42):
        logs_for_day = grouped.get(current, [])
        days.append(
            CalendarDay(
                day=current.day,
                date=current.isoformat(),
                isCurrentMonth=current.month == month_start.month,
                hasLog=len(logs_for_day) > 0
            )
        )
        current += timedelta(days=1)

    today_logs = grouped.get(today, [])
    calendar = CalendarData(
        weekdays=['日', '一', '二', '三', '四', '五', '六'],
        currentMonthLabel=f"{month_start.year}年{month_start.month}月",
        days=days
    )

    return CalendarResponse(
        calendar=calendar,
        todayLogs=_serialize_logs(today_logs),
        selectedDateLabel=f"今天 · {today.strftime('%m月%d日')}"
    )


def get_logs_for_date(db: Session, target: date) -> LogListResponse:
    logs = get_logs_by_date(db, target)
    label_prefix = '今天' if target == date.today() else target.strftime('%m月%d日')
    label = f"{label_prefix} · 销售记录"
    return LogListResponse(label=label, logs=_serialize_logs(logs))

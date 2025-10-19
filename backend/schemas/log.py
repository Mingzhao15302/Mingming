from typing import List
from pydantic import BaseModel


class SalesLogItem(BaseModel):
    id: int
    title: str
    time: str
    content: str


class CalendarDay(BaseModel):
    day: int
    date: str
    isCurrentMonth: bool
    hasLog: bool


class CalendarData(BaseModel):
    weekdays: List[str]
    currentMonthLabel: str
    days: List[CalendarDay]


class CalendarResponse(BaseModel):
    calendar: CalendarData
    todayLogs: List[SalesLogItem]
    selectedDateLabel: str


class LogListResponse(BaseModel):
    label: str
    logs: List[SalesLogItem]

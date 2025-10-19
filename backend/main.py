from datetime import date, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import api_router
from backend.core.database import DB_PATH, SessionLocal, init_db
from backend.models.sales_log import SalesLog

app = FastAPI(title='辉鑫OS Backend')
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def seed_data():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    session = SessionLocal()
    try:
        has_logs = session.query(SalesLog).first()
        if not has_logs:
            today = date.today()
            demo_logs = [
                SalesLog(
                    log_date=today,
                    title='回访中港灌装项目',
                    time='09:30',
                    content='确认设备选型与厂房改造进度，客户对智能灌装线表现出高度兴趣。'
                ),
                SalesLog(
                    log_date=today - timedelta(days=1),
                    title='华盛饮品试产协调',
                    time='14:00',
                    content='组织工艺团队进行试产保障沟通，输出定制化消毒模组方案。'
                ),
                SalesLog(
                    log_date=today - timedelta(days=3),
                    title='德润乳品项目推进',
                    time='16:30',
                    content='提交最新报价并安排下周实地勘查，客户拟签排产协议。'
                ),
                SalesLog(
                    log_date=today - timedelta(days=5),
                    title='青禾功能饮料交流',
                    time='11:15',
                    content='完成包装线设计演示并确认试制样品批次。'
                ),
            ]
            session.add_all(demo_logs)
            session.commit()
    finally:
        session.close()


@app.on_event('startup')
def on_startup():
    init_db()
    seed_data()


@app.get('/')
def health_check():
    return {'status': 'ok'}

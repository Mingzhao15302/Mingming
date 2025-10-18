from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_DIR = Path(__file__).resolve().parent.parent.parent / 'database'
DATABASE_DIR.mkdir(exist_ok=True)
DATABASE_URL = f'sqlite:///{DATABASE_DIR / "huiyun_os.db"}'

engine = create_engine(
    DATABASE_URL,
    connect_args={'check_same_thread': False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

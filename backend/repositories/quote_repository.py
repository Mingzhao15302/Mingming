from sqlalchemy.orm import Session

from backend.models.quote import Quote


def create_quote(db: Session, quote: Quote) -> Quote:
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote

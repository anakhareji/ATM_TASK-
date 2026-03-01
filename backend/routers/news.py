from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from utils.security import get_current_user, ADMIN
from models.news import CampusNews
from models.audit_log import AuditLog
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    tags=["Campus News"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class NewsCreate(BaseModel):
    title: str
    content: str

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    published: Optional[bool] = None

# ADMIN: Create News
@router.post("", status_code=status.HTTP_201_CREATED)
def create_news(
    data: NewsCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can post news")
    news = CampusNews(
        title=data.title,
        content=data.content,
        created_by=current_user["user_id"]
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    
    # Notify All Users
    from models.user import User
    from routers.notification import add_notification
    users = db.query(User).all()
    for u in users:
        add_notification(
            db, 
            user_id=u.id, 
            title="Campus Update", 
            message=f"New bulletin posted: '{news.title}'", 
            type="system"
        )

    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="news.create",
        entity_type="news",
        entity_id=news.id
    ))
    db.commit()
    return {"id": news.id, "title": news.title, "content": news.content, "created_at": news.created_at, "created_by": news.created_by}
    

# Public: View All News
@router.get("")
def get_all_news(db: Session = Depends(get_db)):
    return db.query(CampusNews).order_by(CampusNews.created_at.desc()).all()

# ADMIN: Update News (title/content/published)
@router.put("/{news_id}")
def update_news(
    news_id: int,
    data: NewsUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can edit news")
    news = db.query(CampusNews).filter(CampusNews.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    if data.title is not None:
        news.title = data.title
    if data.content is not None:
        news.content = data.content
    if data.published is not None:
        news.published = data.published
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="news.update",
        entity_type="news",
        entity_id=news_id
    ))
    db.commit()
    db.refresh(news)
    return {"id": news.id, "title": news.title, "content": news.content, "created_at": news.created_at, "created_by": news.created_by}

# ADMIN: Delete News
@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete news")
    news = db.query(CampusNews).filter(CampusNews.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    db.delete(news)
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="news.delete",
        entity_type="news",
        entity_id=news_id
    ))
    db.commit()
    return None

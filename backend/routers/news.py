import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from database import SessionLocal
from utils.security import get_current_user, ADMIN
from models.news import CampusNews
from models.audit_log import AuditLog

router = APIRouter(tags=["Campus News"])

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "news")
os.makedirs(UPLOADS_DIR, exist_ok=True)

VALID_CATEGORIES = {"academic", "announcement", "placement", "achievement", "general"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def calc_read_time(content: str) -> int:
    """Estimate reading time at 200 words/min."""
    words = len((content or "").split())
    return max(1, round(words / 200))


def save_cover_image(file: UploadFile) -> str:
    """Save uploaded image and return relative URL path."""
    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = os.path.join(UPLOADS_DIR, fname)
    with open(fpath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"/uploads/news/{fname}"


def news_dict(n: CampusNews) -> dict:
    return {
        "id":              n.id,
        "title":           n.title,
        "content":         n.content,
        "category":        n.category or "general",
        "cover_image_url": n.cover_image_url,
        "tags":            n.tags,
        "is_featured":     bool(n.is_featured),
        "source":          n.source or "internal",
        "external_url":    n.external_url,
        "read_time_mins":  n.read_time_mins,
        "published":       bool(n.published),
        "created_by":      n.created_by,
        "created_at":      n.created_at.isoformat() if n.created_at else None,
        "updated_at":      n.updated_at.isoformat() if n.updated_at else None,
    }


# ── Public: View All Published News ──────────────────────────────────────────
@router.get("")
def get_all_news(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    q = db.query(CampusNews).filter(CampusNews.published == True)
    if category and category != "all":
        q = q.filter(CampusNews.category == category.lower())
    if featured is not None:
        q = q.filter(CampusNews.is_featured == featured)
    items = q.order_by(CampusNews.is_featured.desc(), CampusNews.created_at.desc()).all()
    return [news_dict(n) for n in items]


# ── Admin: View All News (including unpublished) ──────────────────────────────
@router.get("/admin/all")
def get_all_news_admin(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admins only")
    items = db.query(CampusNews).order_by(CampusNews.created_at.desc()).all()
    return [news_dict(n) for n in items]


# ── Admin: Create News ────────────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_news(
    title:       str           = Form(...),
    content:     str           = Form(...),
    category:    Optional[str] = Form("general"),
    tags:        Optional[str] = Form(None),
    is_featured: Optional[bool] = Form(False),
    published:   Optional[bool] = Form(False),
    image:       Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can post news")

    cat = (category or "general").lower()
    if cat not in VALID_CATEGORIES:
        cat = "general"

    cover_url = None
    if image and image.filename:
        cover_url = save_cover_image(image)

    news = CampusNews(
        title           = title,
        content         = content,
        category        = cat,
        cover_image_url = cover_url,
        tags            = tags,
        is_featured     = bool(is_featured),
        source          = "internal",
        published       = bool(published),
        read_time_mins  = calc_read_time(content),
        created_by      = current_user["user_id"],
    )
    db.add(news)
    db.commit()
    db.refresh(news)

    # Notify all users when published
    if news.published:
        try:
            from models.user import User
            from routers.notification import add_notification
            for u in db.query(User).all():
                add_notification(
                    db, user_id=u.id,
                    title="Campus Update",
                    message=f"New bulletin posted: '{news.title}'",
                    type="system"
                )
        except Exception:
            pass

    db.add(AuditLog(user_id=current_user["user_id"], action="news.create", entity_type="news", entity_id=news.id))
    db.commit()
    return news_dict(news)


# ── Admin: Update News ────────────────────────────────────────────────────────
@router.put("/{news_id}")
async def update_news(
    news_id:     int,
    title:       Optional[str]  = Form(None),
    content:     Optional[str]  = Form(None),
    category:    Optional[str]  = Form(None),
    tags:        Optional[str]  = Form(None),
    is_featured: Optional[bool] = Form(None),
    published:   Optional[bool] = Form(None),
    image:       Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can edit news")

    news = db.query(CampusNews).filter(CampusNews.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    if title is not None:
        news.title = title
    if content is not None:
        news.content = content
        news.read_time_mins = calc_read_time(content)
    if category is not None:
        cat = category.lower()
        news.category = cat if cat in VALID_CATEGORIES else "general"
    if tags is not None:
        news.tags = tags
    if is_featured is not None:
        news.is_featured = bool(is_featured)
    if published is not None:
        news.published = bool(published)
    if image and image.filename:
        news.cover_image_url = save_cover_image(image)

    from datetime import datetime
    news.updated_at = datetime.utcnow()

    db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="news.update", entity_type="news", entity_id=news_id))
    db.commit()
    db.refresh(news)
    return news_dict(news)


# ── Admin: Toggle Featured ────────────────────────────────────────────────────
@router.patch("/{news_id}/feature")
def toggle_featured(
    news_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admins only")
    news = db.query(CampusNews).filter(CampusNews.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="Not found")
    news.is_featured = not bool(news.is_featured)
    db.commit()
    db.refresh(news)
    return news_dict(news)


# ── Admin: Toggle Publish ─────────────────────────────────────────────────────
@router.patch("/{news_id}/publish")
def toggle_publish(
    news_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admins only")
    news = db.query(CampusNews).filter(CampusNews.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="Not found")
    news.published = not bool(news.published)
    db.commit()
    db.refresh(news)
    return news_dict(news)


# ── Admin: Delete News ────────────────────────────────────────────────────────
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
    db.add(AuditLog(user_id=current_user["user_id"], action="news.delete", entity_type="news", entity_id=news_id))
    db.commit()
    return None

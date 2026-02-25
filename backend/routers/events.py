from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from utils.security import get_current_user, ADMIN
from models.events import CampusEvent
from models.audit_log import AuditLog
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    tags=["Campus Events"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class EventCreate(BaseModel):
    title: str
    description: str
    event_date: datetime

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None

# ADMIN: Create Event
@router.post("", status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create events")

    event = CampusEvent(title=data.title, description=data.description, event_date=data.event_date)

    db.add(event)
    db.commit()
    db.refresh(event)
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="create_event",
        entity_type="event",
        entity_id=event.id
    ))
    db.commit()

    return {"id": event.id, "title": event.title, "description": event.description, "event_date": event.event_date, "created_at": event.created_at}


# Public: View All Events
@router.get("")
def get_all_events(db: Session = Depends(get_db)):
    return db.query(CampusEvent).all()

# ADMIN: Update Event
@router.put("/{event_id}")
def update_event(
    event_id: int,
    data: EventUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can edit events")
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if data.title is not None:
        event.title = data.title
    if data.description is not None:
        event.description = data.description
    if data.event_date is not None:
        event.event_date = data.event_date
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="update_event",
        entity_type="event",
        entity_id=event_id
    ))
    db.commit()
    return {"id": event.id, "title": event.title, "description": event.description, "event_date": event.event_date, "created_at": event.created_at}

# ADMIN: Delete Event
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete events")
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="delete_event",
        entity_type="event",
        entity_id=event_id
    ))
    db.commit()
    return None

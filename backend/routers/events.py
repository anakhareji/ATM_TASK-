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

    # Notify All Users
    from models.user import User
    from routers.notification import add_notification
    users = db.query(User).all()
    for u in users:
        add_notification(
            db, 
            user_id=u.id, 
            title="New Campus Event", 
            message=f"Event scheduled: '{event.title}' on {event.event_date.strftime('%Y-%m-%d')}", 
            type="event"
        )

    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="create_event",
        entity_type="event",
        entity_id=event.id
    ))
    db.commit()

    return {"id": event.id, "title": event.title, "description": event.description, "event_date": event.event_date, "created_at": event.created_at}


# Student: Request to Host Event
@router.post("/request", status_code=status.HTTP_201_CREATED)
def request_event(
    data: EventCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can request to host events")

    event = CampusEvent(
        title=data.title, 
        description=data.description, 
        event_date=data.event_date,
        status="pending",
        host_student_id=current_user["user_id"]
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="request_event",
        entity_type="event",
        entity_id=event.id
    ))
    db.commit()
    return {"message": "Event request submitted for admin approval", "id": event.id}

# Admin: Approve/Reject Event
@router.patch("/{event_id}/approve")
def approve_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not event: raise HTTPException(404, "Event not found")
    
    event.status = "approved"
    db.commit()

    # Notify Host Student
    from routers.notification import add_notification
    if event.host_student_id:
        add_notification(
            db, 
            user_id=event.host_student_id, 
            title="Event Approved", 
            message=f"Your request to host '{event.title}' has been approved by admin.", 
            type="event"
        )

    db.add(AuditLog(user_id=current_user["user_id"], action="approve_event", entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event approved"}

@router.patch("/{event_id}/reject")
def reject_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not event: raise HTTPException(404, "Event not found")
    
    event.status = "rejected"
    db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="reject_event", entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event rejected"}

# Modified Public View: Only show approved events (Admin sees all)
@router.get("")
def get_all_events(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] == ADMIN:
        return db.query(CampusEvent).order_by(CampusEvent.event_date.desc()).all()
    return db.query(CampusEvent).filter(CampusEvent.status == "approved").order_by(CampusEvent.event_date.desc()).all()

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

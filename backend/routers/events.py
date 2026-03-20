from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import SessionLocal
from utils.security import get_current_user, ADMIN
from models.events import CampusEvent
from models.audit_log import AuditLog
from datetime import datetime
from typing import Optional
import os, shutil, uuid

router = APIRouter(tags=["Campus Events"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "events")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_image(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"/uploads/events/{filename}"


def event_dict(ev: CampusEvent) -> dict:
    return {
        "id": ev.id,
        "title": ev.title,
        "description": ev.description,
        "event_date": ev.event_date,
        "status": ev.status,
        "host_student_id": ev.host_student_id,
        "image_url": ev.image_url,
        "location": ev.location,
        "organizer": ev.organizer,
        "contact_info": ev.contact_info,
        "tags": ev.tags,
        "max_participants": ev.max_participants,
        "created_at": ev.created_at,
    }


# ── ADMIN: Create Event (with image upload) ─────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(
    title: str = Form(...),
    description: str = Form(...),
    event_date: str = Form(...),
    location: Optional[str] = Form(None),
    organizer: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    max_participants: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create events")

    image_url = None
    if image and image.filename:
        image_url = save_image(image)

    ev = CampusEvent(
        title=title, description=description,
        event_date=datetime.fromisoformat(event_date.replace("Z", "+00:00")),
        location=location, organizer=organizer,
        contact_info=contact_info, tags=tags,
        max_participants=max_participants,
        image_url=image_url,
        status="approved"
    )
    db.add(ev); db.commit(); db.refresh(ev)

    # Notify all users
    from models.user import User
    from routers.notification import add_notification
    for u in db.query(User).all():
        add_notification(db, user_id=u.id, title="New Campus Event",
            message=f"Event scheduled: '{ev.title}' on {ev.event_date.strftime('%Y-%m-%d')}",
            type="event")

    db.add(AuditLog(user_id=current_user["user_id"], action="create_event",
                    entity_type="event", entity_id=ev.id))
    db.commit()
    return event_dict(ev)


# ── Student: Request to Host Event (with image) ─────────────────────────────
@router.post("/request", status_code=status.HTTP_201_CREATED)
async def request_event(
    title: str = Form(...),
    description: str = Form(...),
    event_date: str = Form(...),
    location: Optional[str] = Form(None),
    organizer: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    max_participants: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can request to host events")

    image_url = None
    if image and image.filename:
        image_url = save_image(image)

    ev = CampusEvent(
        title=title, description=description,
        event_date=datetime.fromisoformat(event_date.replace("Z", "+00:00")),
        location=location, organizer=organizer,
        contact_info=contact_info, tags=tags,
        max_participants=max_participants,
        image_url=image_url,
        status="pending",
        host_student_id=current_user["user_id"]
    )
    db.add(ev); db.commit(); db.refresh(ev)
    db.add(AuditLog(user_id=current_user["user_id"], action="request_event",
                    entity_type="event", entity_id=ev.id))
    db.commit()
    return {"message": "Event request submitted for admin approval", "id": ev.id}


# ── Admin: Approve ───────────────────────────────────────────────────────────
@router.patch("/{event_id}/approve")
def approve_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    ev.status = "approved"; db.commit()
    from routers.notification import add_notification
    if ev.host_student_id:
        add_notification(db, user_id=ev.host_student_id, title="Event Approved",
            message=f"Your request to host '{ev.title}' has been approved.", type="event")
    db.add(AuditLog(user_id=current_user["user_id"], action="approve_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event approved"}


# ── Admin: Reject ────────────────────────────────────────────────────────────
@router.patch("/{event_id}/reject")
def reject_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    ev.status = "rejected"; db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="reject_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event rejected"}


# ── Student: Request End ─────────────────────────────────────────────────────
@router.patch("/{event_id}/request-end")
def request_end_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "student": raise HTTPException(403, "Only students can request to end events")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    if ev.host_student_id != current_user["user_id"]: raise HTTPException(403, "You can only end an event you hosted")
    if ev.status != "approved": raise HTTPException(400, "Only approved events can be ended")
    ev.status = "end_requested"; db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="request_end_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "End request sent to admin"}


# ── Admin: Approve End ───────────────────────────────────────────────────────
@router.patch("/{event_id}/approve-end")
def approve_end_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    ev.status = "ended"; db.commit()
    from routers.notification import add_notification
    if ev.host_student_id:
        add_notification(db, user_id=ev.host_student_id, title="Event End Approved",
            message=f"Your request to end '{ev.title}' has been approved.", type="event")
    db.add(AuditLog(user_id=current_user["user_id"], action="approve_end_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event ended"}


# ── Admin: Hold ──────────────────────────────────────────────────────────────
@router.patch("/{event_id}/hold")
def hold_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    ev.status = "held"; db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="hold_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event on hold"}


# ── Admin: Unhold ────────────────────────────────────────────────────────────
@router.patch("/{event_id}/unhold")
def unhold_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    ev.status = "approved"; db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="unhold_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return {"message": "Event resumed"}


# ── GET All Events ───────────────────────────────────────────────────────────
@router.get("")
def get_all_events(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] == ADMIN:
        rows = db.query(CampusEvent).order_by(CampusEvent.event_date.desc()).all()
    else:
        from sqlalchemy import or_
        rows = db.query(CampusEvent).filter(
            or_(
                CampusEvent.status == "approved",
                CampusEvent.host_student_id == current_user["user_id"]
            )
        ).order_by(CampusEvent.event_date.desc()).all()
    return [event_dict(r) for r in rows]


# ── Admin: Update Event (with image) ─────────────────────────────────────────
@router.put("/{event_id}")
async def update_event(
    event_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    event_date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    organizer: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    max_participants: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(403, "Only admin can edit events")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")

    if title is not None:        ev.title = title
    if description is not None:  ev.description = description
    if event_date is not None:   ev.event_date = datetime.fromisoformat(event_date.replace("Z", "+00:00"))
    if location is not None:     ev.location = location
    if organizer is not None:    ev.organizer = organizer
    if contact_info is not None: ev.contact_info = contact_info
    if tags is not None:         ev.tags = tags
    if max_participants is not None: ev.max_participants = max_participants
    if image and image.filename:
        ev.image_url = save_image(image)

    db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="update_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return event_dict(ev)


# ── Admin: Delete Event ───────────────────────────────────────────────────────
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN:
        raise HTTPException(403, "Only admin can delete events")
    ev = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not ev: raise HTTPException(404, "Event not found")
    db.delete(ev); db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="delete_event",
                    entity_type="event", entity_id=event_id))
    db.commit()
    return None

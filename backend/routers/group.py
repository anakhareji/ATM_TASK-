from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

from models.group import ProjectGroup, GroupMember, ContributionLog
from models.project_faculty import ProjectFaculty
from schemas.group import GroupCreate, AddGroupMember, GroupEvaluationRequest
from utils.security import get_current_user, FACULTY, ADMIN

router = APIRouter(
    tags=["Groups & Contributions"]
)

@router.post("")
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Admin or Faculty assigned to project
    if current_user["role"] == FACULTY:
        assignment = db.query(ProjectFaculty).filter(
            ProjectFaculty.project_id == data.project_id,
            ProjectFaculty.faculty_id == current_user["user_id"]
        ).first()
        if not assignment:
            raise HTTPException(403, "Not assigned to this project")
    elif current_user["role"] != ADMIN:
        raise HTTPException(403, "Unauthorized")

    group = ProjectGroup(
        project_id=data.project_id,
        name=data.name
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    return {"message": "Group created", "id": group.id}

@router.post("/{group_id}/members")
def add_member(
    group_id: int,
    data: AddGroupMember,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    group = db.query(ProjectGroup).filter(ProjectGroup.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    # Access check (Faculty assigned to project)
    if current_user["role"] == FACULTY:
        assignment = db.query(ProjectFaculty).filter(
            ProjectFaculty.project_id == group.project_id,
            ProjectFaculty.faculty_id == current_user["user_id"]
        ).first()
        if not assignment:
            raise HTTPException(403, "Access denied")

    # Prevent duplicates
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.student_id == data.student_id
    ).first()
    if existing:
        raise HTTPException(400, "Student already in group")

    member = GroupMember(
        group_id=group_id,
        student_id=data.student_id
    )
    db.add(member)
    db.commit()

    return {"message": "Member added"}

@router.get("/project/{project_id}")
def get_project_groups(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    groups = db.query(ProjectGroup).filter(ProjectGroup.project_id == project_id).all()
    
    res = []
    for g in groups:
        members = db.query(GroupMember).filter(GroupMember.group_id == g.id).all()
        res.append({
            "id": g.id,
            "name": g.name,
            "status": g.status,
            "is_locked": bool(g.is_locked),
            "members": [
                {
                    "student_id": m.student_id,
                    "is_leader": bool(m.is_leader)
                } for m in members
            ]
        })
    return res

# --- MANAGE MEMBERS ---

@router.delete("/{group_id}/members/{student_id}")
def remove_member(
    group_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Authorization Check (simplified for brevity)
    if current_user["role"] != FACULTY:
         # In a real app, verify they own the project too
         raise HTTPException(403, "Faculty only")

    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.student_id == student_id
    ).first()
    
    if not member:
        raise HTTPException(404, "Member not found")
        
    db.delete(member)
    db.commit()
    return {"message": "Member removed"}

@router.put("/{group_id}/leader")
def set_group_leader(
    group_id: int,
    data: dict, # Expects {"student_id": int}
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
        
    student_id = data.get("student_id")
    
    # Reset current leaders
    db.query(GroupMember).filter(GroupMember.group_id == group_id).update({"is_leader": 0})
    
    # Set new leader
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.student_id == student_id
    ).first()
    
    if not member:
        raise HTTPException(404, "Member not found")
        
    member.is_leader = 1
    db.commit()
    return {"message": "Leader updated"}

# --- MANAGE GROUPS ---

@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
        
    group = db.query(ProjectGroup).filter(ProjectGroup.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")
        
    db.delete(group)
    db.commit()
    return {"message": "Group deleted"}

@router.put("/{group_id}/rename")
def rename_group(
    group_id: int,
    data: dict, # {"name": str}
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
        
    group = db.query(ProjectGroup).filter(ProjectGroup.id == group_id).first()
    if not group:
         raise HTTPException(404, "Group not found")
         
    group.name = data.get("name")
    db.commit()
    return {"message": "Group renamed"}

@router.post("/{group_id}/evaluate")
def evaluate_group_contribution(
    group_id: int,
    data: GroupEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")

    # Clear old logs for this task/group if any
    db.query(ContributionLog).filter(
        ContributionLog.group_id == group_id,
        ContributionLog.task_id == data.task_id
    ).delete()

    for m in data.members:
        log = ContributionLog(
            group_id=group_id,
            student_id=m.student_id,
            task_id=data.task_id,
            contribution_weight=m.contribution_weight,
            contribution_score=m.contribution_score,
            participation_score=m.participation_score,
            collaboration_score=m.collaboration_score,
            remarks=m.remarks
        )
        db.add(log)
    
    db.commit()
    return {"message": "Group evaluation synchronized successfully"}

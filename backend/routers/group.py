from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

from models.group import ProjectGroup, GroupMember, ContributionLog
from models.project_faculty import ProjectFaculty
from schemas.group import GroupCreate, AddGroupMember, GroupEvaluationRequest
from utils.security import get_current_user, FACULTY, ADMIN
from routers.notification import add_notification

router = APIRouter(
    tags=["Groups & Contributions"]
)

@router.get("/my-groups")
def get_my_groups(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from models.user import User
    from models.project import Project
    
    user_id = current_user["user_id"]
    
    # Get IDs of groups the student is in
    group_ids = db.query(GroupMember.group_id).filter(GroupMember.student_id == user_id).all()
    group_ids = [r[0] for r in group_ids]
    
    if not group_ids:
        return []
    
    groups = db.query(ProjectGroup).filter(ProjectGroup.id.in_(group_ids)).all()
    
    res = []
    for g in groups:
        project = db.query(Project).filter(Project.id == g.project_id).first()
        members = db.query(GroupMember, User).join(User, GroupMember.student_id == User.id).filter(GroupMember.group_id == g.id).all()
        
        res.append({
            "id": g.id,
            "name": g.name,
            "project_id": g.project_id,
            "project_title": project.title if project else "Unknown Project",
            "project_description": project.description if project else "",
            "status": g.status,
            "members": [
                {
                    "student_id": m[1].id,
                    "name": m[1].name,
                    "email": m[1].email,
                    "is_leader": bool(int(m[0].is_leader or 0) == 1)
                } for m in members
            ]
        })
    return res

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
    db.flush() # Get the group ID before commit

    # Add Members
    if data.student_ids:
        for sid in data.student_ids:
            member = GroupMember(
                group_id=group.id,
                student_id=sid,
                is_leader=1 if sid == data.leader_id else 0
            )
            db.add(member)

    db.commit()
    db.refresh(group)

    # Notify Members
    if data.student_ids:
        for sid in data.student_ids:
            add_notification(
                db, 
                user_id=sid, 
                title="Squad Assignment", 
                message=f"You have been deployed to squad '{group.name}' for operational duty.",
                type="group"
            )

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

    add_notification(
        db, 
        user_id=data.student_id, 
        title="Squad Reinforcement", 
        message=f"You have been added to squad '{group.name}' as reinforcements.",
        type="group"
    )

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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models.project import Project
from models.project_faculty import ProjectFaculty
from models.user import User
from models.academic import Department, Course
from schemas.project import ProjectCreateRequest, AssignProjectRequest
from utils.security import get_current_user, ADMIN, FACULTY
from models.audit_log import AuditLog

router = APIRouter(
    tags=["Projects"]
)

# ======================
# DB Dependency
# ======================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ======================
# CREATE PROJECT (ADMIN)
# ======================
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admin can create projects"
        )

    project = Project(
        title=data.title,
        description=data.description,
        department=data.department,
        semester=data.semester,
        created_by=current_user["user_id"]
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "message": "Project created successfully",
        "project_id": project.id
    }


# ======================
# ASSIGN PROJECT TO FACULTY (ADMIN)
# ======================
@router.post("/assign", status_code=status.HTTP_200_OK)
def assign_project_to_faculty(
    data: AssignProjectRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admin can assign projects"
        )

    # Check project exists
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check faculty exists
    faculty = db.query(User).filter(
        User.id == data.faculty_id,
        User.role == FACULTY,
        User.status == "active"
    ).first()

    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Faculty not found or inactive"
        )

    # Prevent duplicate assignment
    existing = db.query(ProjectFaculty).filter(
        ProjectFaculty.project_id == data.project_id,
        ProjectFaculty.faculty_id == data.faculty_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Project already assigned to this faculty"
        )

    assignment = ProjectFaculty(
        project_id=data.project_id,
        faculty_id=data.faculty_id
    )

    db.add(assignment)
    db.commit()

    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="assign_project",
        entity_type="project",
        entity_id=data.project_id
    ))
    db.commit()

    return {
        "message": "Project assigned to faculty successfully"
    }


# ======================
# VIEW ASSIGNED PROJECTS (FACULTY)
# ======================
@router.get("/faculty")
def view_assigned_projects_for_faculty(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(
            status_code=403,
            detail="Only faculty can view assigned projects"
        )

    projects = (
        db.query(Project)
        .join(ProjectFaculty, Project.id == ProjectFaculty.project_id)
        .filter(ProjectFaculty.faculty_id == current_user["user_id"])
        .all()
    )

    return [
        {
            "project_id": project.id,
            "title": project.title,
            "department_id": getattr(project, "department_id", None),
            "department_name": db.query(Department.name).filter(Department.id == project.department_id).scalar() if getattr(project, "department_id", None) else None,
            "course_id": getattr(project, "course_id", None),
            "course_name": db.query(Course.name).filter(Course.id == project.course_id).scalar() if getattr(project, "course_id", None) else None,
            "semester": project.semester
        }
        for project in projects
    ]


# ======================
# LIST ALL PROJECTS (ADMIN)
# ======================
@router.get("/")
def list_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "department_id": getattr(p, "department_id", None),
            "department_name": db.query(Department.name).filter(Department.id == p.department_id).scalar() if getattr(p, "department_id", None) else None,
            "course_id": getattr(p, "course_id", None),
            "course_name": db.query(Course.name).filter(Course.id == p.course_id).scalar() if getattr(p, "course_id", None) else None,
            "semester": p.semester
        } for p in projects
    ]

# ======================
# DELETE PROJECT (ADMIN)
# ======================
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="delete_project",
        entity_type="project",
        entity_id=project_id
    ))
    db.commit()
    return {"message": "Project deleted successfully"}

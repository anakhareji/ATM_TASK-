from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# -------- Import Models --------
from models.user import User
from models.project import Project
from models.project_faculty import ProjectFaculty
from models.task_submission import TaskSubmission
from models.student_performance import StudentPerformance
from models.academic_planner import AcademicPlanner
from models.todo import Todo
from models.group import ProjectGroup, GroupMember, ContributionLog
from models.audit_log import AuditLog
from models.notification import Notification
from models.student_recommendation import StudentRecommendation
from models.academic import Department, Course
from models.academic_saas import (
    Organization, DepartmentV1, Program, CourseV1, AcademicYear, SemesterV1, Section,
    Role, Permission, RolePermission, StructureVersion, Batch
)
from models.settings import SystemSettings

# -------- Import Routers --------
from routers.auth import router as auth_router
from routers.test import router as test_router
from routers.admin import router as admin_router
from routers.project import router as project_router
from routers.task import router as task_router
from routers.performance import router as performance_router
from routers.recognition import router as recognition_router
from routers.planner import router as planner_router
from routers.todo import router as todo_router
from routers.dashboard import router as dashboard_router
from routers.group import router as group_router
from routers.notification import router as notification_router
from routers.news import router as news_router
from routers.events import router as events_router
from routers.faculty import router as faculty_router
from routers.audit import router as audit_router
from routers.academic import router as academic_router
from routers.academic_structure_v1 import router as academic_structure_v1_router
from routers.admin_v1 import router as admin_v1_router

# -------- Create App --------
app = FastAPI(
    title="Academic Task Management System",
    version="1.0.0"
)

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Create Tables --------
Base.metadata.create_all(bind=engine)

# -------- Include Routers (ONLY PREFIX HERE) --------
app.include_router(auth_router, prefix="/api/auth")
app.include_router(test_router, prefix="/api/test")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(project_router, prefix="/api/projects")
app.include_router(task_router, prefix="/api/tasks")
app.include_router(performance_router, prefix="/api/performance")
app.include_router(recognition_router, prefix="/api/recognition")
app.include_router(planner_router, prefix="/api/planner")
app.include_router(todo_router, prefix="/api/todo")
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(group_router, prefix="/api/groups")
app.include_router(notification_router, prefix="/api/notifications")
app.include_router(news_router, prefix="/api/news")
app.include_router(events_router, prefix="/api/events")
app.include_router(faculty_router, prefix="/api/faculty")
app.include_router(audit_router, prefix="/api/admin")
app.include_router(academic_router, prefix="/api/academic")
app.include_router(academic_structure_v1_router, prefix="/api/v1/academic-structure")
app.include_router(academic_structure_v1_router, prefix="/api/v1/academic_structure")
app.include_router(admin_v1_router, prefix="/api/v1/admin")

# -------- Root --------
@app.get("/")
def root():
    return {"message": "Academic Task Management Backend Running Successfully 🚀"}

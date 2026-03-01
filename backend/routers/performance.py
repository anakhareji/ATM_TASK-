from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import SessionLocal
from utils.security import get_current_user, FACULTY, ADMIN
from models.student_performance import StudentPerformance
from models.project_faculty import ProjectFaculty
from models.user import User
from models.group import ContributionLog, ProjectGroup
from models.audit_log import AuditLog
from schemas.performance import PerformanceCreateRequest
from services.performance_service import calculate_system_performance
from fastapi.responses import StreamingResponse
import csv
import io

router = APIRouter(
    tags=["Performance"]
)


# =====================================================
# DB Dependency
# =====================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================
# CREATE PERFORMANCE REPORT
# =====================================================
@router.post("/")
def create_performance_report(
    data: PerformanceCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # 🔒 Faculty Only
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can evaluate students")

    # 🔒 Verify Faculty Assignment
    assignment = db.query(ProjectFaculty).filter(
        ProjectFaculty.project_id == data.project_id,
        ProjectFaculty.faculty_id == current_user["user_id"]
    ).first()

    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")

    # 🔒 Verify Student
    student = db.query(User).filter(
        User.id == data.student_id,
        User.role == "student",
        User.status == "active"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found or inactive")

    # 🔒 Prevent Duplicate Record
    existing = db.query(StudentPerformance).filter(
        StudentPerformance.student_id == data.student_id,
        StudentPerformance.project_id == data.project_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Performance already generated for this student in this project"
        )

    # =====================================================
    # APPLY GROUP CONTRIBUTION
    # =====================================================
    adjusted_score = float(data.score)

    group = db.query(ProjectGroup).filter(
        ProjectGroup.project_id == data.project_id
    ).first()

    if group:
        contribution = db.query(ContributionLog).filter(
            ContributionLog.group_id == group.id,
            ContributionLog.student_id == data.student_id
        ).first()

        if contribution:
            adjusted_score *= (contribution.contribution_weight / 100)

    adjusted_score = round(adjusted_score, 2)

    # =====================================================
    # SYSTEM PERFORMANCE
    # =====================================================
    system_data = calculate_system_performance(
        db,
        data.student_id,
        data.project_id
    )

    system_score = round(system_data.get("system_score", 0), 2)

    # =====================================================
    # FINAL SCORE (70% system + 30% faculty)
    # =====================================================
    final_score = round((system_score * 0.7) + (adjusted_score * 0.3), 2)

    # =====================================================
    # GRADE CALCULATION
    # =====================================================
    if final_score >= 90:
        grade = "A+"
    elif final_score >= 80:
        grade = "A"
    elif final_score >= 70:
        grade = "B"
    elif final_score >= 60:
        grade = "C"
    else:
        grade = "D"

    # =====================================================
    # SAVE PERFORMANCE (LOCKED)
    # =====================================================
    performance = StudentPerformance(
        student_id=data.student_id,
        faculty_id=current_user["user_id"],
        project_id=data.project_id,
        score=adjusted_score,
        system_score=system_score,
        final_score=final_score,
        grade=grade,
        semester=data.semester,
        remarks=data.remarks,
        is_locked=True
    )

    db.add(performance)
    db.commit()
    db.refresh(performance)

    # =====================================================
    # AUDIT LOG
    # =====================================================
    audit = AuditLog(
        user_id=current_user["user_id"],
        action="Created performance report",
        entity_type="StudentPerformance",
        entity_id=performance.id
    )

    db.add(audit)
    db.commit()

    return {
        "message": "Performance report created successfully",
        "system_score": system_score,
        "faculty_score": adjusted_score,
        "final_score": final_score,
        "grade": grade,
        "performance_id": performance.id
    }

# =====================================================
# MY PERFORMANCE (STUDENT ONLY)
# =====================================================
@router.post("/seed")
def seed_performance_data(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.user import User
    from models.project import Project
    from datetime import datetime, timedelta

    # Seed for the current logged-in student
    student = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not student:
        return {"error": "User not found"}

    project = db.query(Project).first()
    project_id = project.id if project else 1

    records = [
        {"semester": "SEM S4", "score": 75.0, "system_score": 80.0, "final_score": 77.5, "grade": "B",  "offset": 180},
        {"semester": "SEM S5", "score": 82.0, "system_score": 86.0, "final_score": 84.0, "grade": "B+", "offset": 90},
        {"semester": "SEM S6", "score": 88.0, "system_score": 92.0, "final_score": 90.0, "grade": "A",  "offset": 5},
    ]

    added = 0
    for rec in records:
        existing = db.query(StudentPerformance).filter(
            StudentPerformance.student_id == student.id,
            StudentPerformance.semester == rec["semester"]
        ).first()

        if not existing:
            perf = StudentPerformance(
                student_id=student.id,
                project_id=project_id,
                faculty_id=current_user["user_id"],
                semester=rec["semester"],
                score=rec["score"],
                system_score=rec["system_score"],
                final_score=rec["final_score"],
                grade=rec["grade"],
                remarks=f"Good performance during {rec['semester']}",
                created_at=datetime.utcnow() - timedelta(days=rec["offset"])
            )
            db.add(perf)
            added += 1

    db.commit()
    return {"message": f"Added {added} records for {student.name}"}

@router.get("/me")

def get_my_performance_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their performance history")

    performances = db.query(StudentPerformance).filter(
        StudentPerformance.student_id == current_user["user_id"]
    ).order_by(StudentPerformance.created_at.desc()).all()

    return [
        {
            "id": p.id,
            "project_id": p.project_id,
            "semester": p.semester,
            "score": p.score,
            "system_score": p.system_score,
            "final_score": p.final_score,
            "grade": p.grade,
            "remarks": p.remarks,
            "created_at": p.created_at
        }
        for p in performances
    ]



# =====================================================
# LEADERBOARD (TOP 10)
# =====================================================
@router.get("/leaderboard")
def leaderboard(
    min_score: float | None = None,
    max_score: float | None = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(StudentPerformance).filter(
        StudentPerformance.final_score.isnot(None)
    )

    if min_score is not None:
        query = query.filter(StudentPerformance.final_score >= min_score)
    if max_score is not None:
        query = query.filter(StudentPerformance.final_score <= max_score)

    performances = query.join(User, User.id == StudentPerformance.student_id).order_by(
        desc(StudentPerformance.final_score)
    ).limit(limit).all()

    return [
        {
            "student_id": p.student_id,
            "student_name": p.student.name,
            "final_score": p.final_score,
            "grade": p.grade,
            "semester": p.semester
        }
        for p in performances
    ]

# =====================================================
# ADVANCED SEARCH & FILTER
# =====================================================
@router.get("/search")
def search_performance(
    min_score: float | None = None,
    max_score: float | None = None,
    grade: str | None = None,
    semester: str | None = None,
    project_id: int | None = None,
    sort_desc: bool = True,
    db: Session = Depends(get_db)
):

    query = db.query(StudentPerformance)

    # 🔎 Score range filter
    if min_score is not None:
        query = query.filter(StudentPerformance.final_score >= min_score)

    if max_score is not None:
        query = query.filter(StudentPerformance.final_score <= max_score)

    # 🎓 Grade filter
    if grade:
        query = query.filter(StudentPerformance.grade == grade)

    # 📚 Semester filter
    if semester:
        query = query.filter(StudentPerformance.semester == semester)

    # 📘 Project filter
    if project_id:
        query = query.filter(StudentPerformance.project_id == project_id)

    # 📊 Sorting
    if sort_desc:
        query = query.order_by(desc(StudentPerformance.final_score))
    else:
        query = query.order_by(StudentPerformance.final_score)

    results = query.all()

    return [
        {
            "student_id": r.student_id,
            "project_id": r.project_id,
            "final_score": r.final_score,
            "grade": r.grade,
            "semester": r.semester
        }
        for r in results
    ]

# =====================================================
# GRADE DISTRIBUTION (Chart Ready)
# =====================================================
@router.get("/grade-distribution")
def grade_distribution(db: Session = Depends(get_db)):

    grades = ["A+", "A", "B", "C", "D"]

    return {
        g: db.query(StudentPerformance).filter(
            StudentPerformance.grade == g
        ).count()
        for g in grades
    }

# =====================================================
# SEMESTER OVERVIEW (Average Score per Semester)
# =====================================================
@router.get("/semester-overview")
def semester_overview(db: Session = Depends(get_db)):
    results = (
        db.query(
            StudentPerformance.semester,
            func.avg(StudentPerformance.final_score).label("average")
        )
        .filter(StudentPerformance.semester.isnot(None))
        .group_by(StudentPerformance.semester)
        .order_by(StudentPerformance.semester.asc())
        .all()
    )

    return [
        {
            "semester": r[0],
            "average": round(float(r[1] or 0), 2)
        }
        for r in results
    ]

# =====================================================
# EXPORT PERFORMANCE (CSV)
# =====================================================
@router.get("/export")
def export_performance(db: Session = Depends(get_db)):
    # Join with User to get names
    performances = db.query(StudentPerformance).join(
        User, User.id == StudentPerformance.student_id
    ).order_by(desc(StudentPerformance.created_at)).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Student Name", "Project", "Semester", "Final Score", "Grade"])
    
    for p in performances:
        writer.writerow([
            p.student_id, 
            p.student.name, 
            p.project_id, 
            p.semester, 
            p.final_score, 
            p.grade
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=academic_records.csv"}
    )


# =====================================================
# SCORE RANGE FILTER
# =====================================================
@router.get("/score-range")
def filter_by_score_range(
    min_score: float = 0.0,
    max_score: float = 100.0,
    db: Session = Depends(get_db)
):

    if min_score > max_score:
        raise HTTPException(
            status_code=400,
            detail="min_score cannot be greater than max_score"
        )

    results = db.query(StudentPerformance).join(User, User.id == StudentPerformance.student_id).filter(
        StudentPerformance.final_score.isnot(None),
        StudentPerformance.final_score >= min_score,
        StudentPerformance.final_score <= max_score
    ).order_by(desc(StudentPerformance.final_score)).all()

    return [
        {
            "student_id": r.student_id,
            "student_name": r.student.name,
            "final_score": r.final_score,
            "grade": r.grade,
            "semester": r.semester
        }
        for r in results
    ]


# =====================================================
# SEMESTER COMPARISON
# =====================================================
@router.get("/student/{student_id}/semesters")
def semester_comparison(
    student_id: int,
    db: Session = Depends(get_db)
):

    records = db.query(StudentPerformance).filter(
        StudentPerformance.student_id == student_id,
        StudentPerformance.semester.isnot(None)
    ).order_by(StudentPerformance.created_at.asc()).all()

    return [
        {
            "semester": r.semester,
            "final_score": r.final_score,
            "grade": r.grade
        }
        for r in records
    ]


# =====================================================
# VIEW PERFORMANCE (Faculty / Admin)
# =====================================================
@router.get("/student/{student_id}")
def view_student_performance(
    student_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user["role"] not in [FACULTY, ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(StudentPerformance).filter(
        StudentPerformance.student_id == student_id
    ).all()

# =====================================================
# SUBMIT TO ADMIN (Faculty)
# =====================================================
@router.patch("/{performance_id}/submit")
def submit_to_admin(
    performance_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
    
    perf = db.query(StudentPerformance).filter(
        StudentPerformance.id == performance_id,
        StudentPerformance.faculty_id == current_user["user_id"]
    ).first()
    
    if not perf: raise HTTPException(404, "Performance record not found or not owned by you")
    
    perf.submitted_to_admin = True
    db.commit()
    db.add(AuditLog(user_id=current_user["user_id"], action="submit_performance_to_admin", entity_type="performance", entity_id=performance_id))
    db.commit()
    return {"message": "Report submitted to admin successfully"}

# =====================================================
# VIEW SUBMITTED REPORTS (Admin)
# =====================================================
@router.get("/submitted")
def list_submitted_reports(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(403, "Admin only")
        
    reports = db.query(StudentPerformance).filter(StudentPerformance.submitted_to_admin == True).all()
    data = []
    for r in reports:
        data.append({
            "id": r.id,
            "student_name": r.student.name,
            "faculty_name": r.faculty.name,
            "project_title": r.project.title,
            "final_score": r.final_score,
            "grade": r.grade,
            "created_at": r.created_at
        })
    return data

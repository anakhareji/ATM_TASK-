from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from utils.org_context import get_org_id
from utils.rbac import require_permission
from models.academic_saas import (
    DepartmentV1, Program, CourseV1, AcademicYear, SemesterV1, Section, Organization
)
from models.audit_log import AuditLog
from models.user import User
from sqlalchemy import func

router = APIRouter(tags=["Academic Structure V1"])

def ensure_org_exists(org_id: int, db: Session):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        # create a minimal organization record so FK inserts don't fail
        org = Organization(id=org_id, name=f"Org {org_id}", code=f"ORG{org_id}", is_active=True)
        db.add(org)
        db.commit()
        db.refresh(org)

def ensure_unlocked(org_id: int, db: Session, academic_year_id: int | None = None):
    if academic_year_id is None:
        return
    year = db.query(AcademicYear).filter(
        AcademicYear.organization_id == org_id,
        AcademicYear.id == academic_year_id
    ).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    if year.locked:
        raise HTTPException(status_code=423, detail="Academic year locked")

@router.get("/academic-years")
def list_academic_years(org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    return db.query(AcademicYear).filter(
        AcademicYear.organization_id == org_id,
        AcademicYear.is_active == True
    ).order_by(AcademicYear.created_at.desc()).all()

@router.post("/academic-years", status_code=status.HTTP_201_CREATED)
def create_academic_year(data: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_org_exists(org_id, db)
    name = (data or {}).get("name")
    if not name:
        raise HTTPException(status_code=400, detail="name required (e.g., 2024-2025)")
    exists = db.query(AcademicYear).filter(
        AcademicYear.organization_id == org_id,
        AcademicYear.name == name
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="Academic year already exists")
    year = AcademicYear(organization_id=org_id, name=name, locked=False, is_active=True)
    db.add(year)
    db.commit()
    db.refresh(year)
    db.add(AuditLog(user_id=None, action="Academic year created", entity_type="AcademicYear", entity_id=year.id))
    db.commit()
    return year

@router.patch("/academic-years/{id}/toggle-lock", dependencies=[Depends(require_permission("lock_academic_year"))])
def toggle_year_lock(id: int, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    year = db.query(AcademicYear).filter(
        AcademicYear.id == id,
        AcademicYear.organization_id == org_id
    ).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    year.locked = not year.locked
    db.commit()
    db.refresh(year)
    db.add(AuditLog(user_id=None, action=("Academic year locked" if year.locked else "Academic year unlocked"), entity_type="AcademicYear", entity_id=year.id))
    db.commit()
    return {"id": year.id, "locked": year.locked}

@router.get("/departments")
def list_departments(
    org_id: int = Depends(get_org_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    academic_year_id: int | None = Query(None),
    archived: bool = Query(False),
):
    base_q = db.query(DepartmentV1).filter(
        DepartmentV1.organization_id == org_id
    )
    if academic_year_id is not None:
        base_q = base_q.filter(DepartmentV1.academic_year_id == academic_year_id)
    if archived:
        base_q = base_q.filter(DepartmentV1.is_archived == True)
    else:
        base_q = base_q.filter(DepartmentV1.is_active == True, DepartmentV1.is_archived == False)
    total = base_q.count()
    items = base_q.order_by(DepartmentV1.name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "page": page, "page_size": page_size, "total": total}

@router.post("/departments", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("create_department"))])
def create_department(dep: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_org_exists(org_id, db)
    academic_year_id = dep.get("academic_year_id")
    ensure_unlocked(org_id, db, academic_year_id)
    code = dep.get("code")
    name = dep.get("name")
    if not code or not name:
        raise HTTPException(status_code=400, detail="name and code required")
    if not academic_year_id:
        raise HTTPException(status_code=400, detail="academic_year_id required")
    year = db.query(AcademicYear).filter(
        AcademicYear.id == academic_year_id,
        AcademicYear.organization_id == org_id
    ).first()
    if not year or year.locked:
        raise HTTPException(status_code=403, detail="Academic year invalid or locked")
    exists = db.query(DepartmentV1).filter(
        DepartmentV1.organization_id == org_id,
        DepartmentV1.academic_year_id == academic_year_id,
        (DepartmentV1.code == code) | (DepartmentV1.name == name)
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="Department code or name already exists in organization")
    new_dep = DepartmentV1(
        organization_id=org_id,
        academic_year_id=academic_year_id,
        name=name,
        code=code,
        description=dep.get("description"),
        is_active=True
    )
    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)
    db.add(AuditLog(user_id=None, action=f"Department created: {name}", entity_type="Department", entity_id=new_dep.id))
    db.commit()
    return new_dep

@router.delete("/departments/{id}", dependencies=[Depends(require_permission("archive_department"))])
def archive_department(id: int, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_unlocked(org_id, db)
    dep = db.query(DepartmentV1).filter(
        DepartmentV1.id == id,
        DepartmentV1.organization_id == org_id
    ).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Department not found")
    if dep.is_archived:
        return {"archived": True}
    active_programs = db.query(Program).filter(
        Program.department_id == id,
        Program.organization_id == org_id,
        Program.is_active == True
    ).count()
    if active_programs:
        raise HTTPException(status_code=400, detail="Cannot archive department with active programs")
    dep.is_active = False
    dep.is_archived = True
    db.commit()
    db.add(AuditLog(user_id=None, action=f"Department archived: {dep.name}", entity_type="Department", entity_id=dep.id))
    db.commit()
    return {"archived": True}

@router.patch("/departments/{id}/activate", dependencies=[Depends(require_permission("activate_department"))])
def activate_department(id: int, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    dep = db.query(DepartmentV1).filter(
        DepartmentV1.id == id,
        DepartmentV1.organization_id == org_id
    ).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Department not found")
    dep.is_active = True
    dep.is_archived = False
    db.commit()
    db.add(AuditLog(user_id=None, action=f"Department activated: {dep.name}", entity_type="Department", entity_id=dep.id))
    db.commit()
    return {"active": True}

@router.get("/programs")
def list_programs(org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    return db.query(Program).filter(
        Program.organization_id == org_id,
        Program.is_active == True
    ).all()

@router.post("/programs", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("create_program"))])
def create_program(program: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_unlocked(org_id, db, None)
    dept_id = program.get("department_id")
    name = program.get("name")
    type_ = program.get("type")
    duration_years = int(program.get("duration_years") or 0)
    intake_capacity = int(program.get("intake_capacity") or 0)
    if not dept_id or not name:
        raise HTTPException(status_code=400, detail="department_id and name required")
    dept = db.query(DepartmentV1).filter(
        DepartmentV1.id == dept_id,
        DepartmentV1.organization_id == org_id,
        DepartmentV1.is_active == True
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found in organization")
    new_program = Program(
        organization_id=org_id,
        department_id=dept_id,
        name=name,
        type=type_,
        duration_years=duration_years,
        intake_capacity=intake_capacity
    )
    db.add(new_program)
    db.commit()
    db.refresh(new_program)
    db.add(AuditLog(user_id=None, action=f"Program created: {name}", entity_type="Program", entity_id=new_program.id))
    db.commit()
    return new_program

@router.put("/programs/{id}", dependencies=[Depends(require_permission("create_program"))])
def update_program(id: int, program: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_unlocked(org_id, db, None)
    prog = db.query(Program).filter(
        Program.id == id,
        Program.organization_id == org_id
    ).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
        
    dept_id = program.get("department_id")
    if dept_id:
        dept = db.query(DepartmentV1).filter(
            DepartmentV1.id == dept_id,
            DepartmentV1.organization_id == org_id,
            DepartmentV1.is_active == True
        ).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found in organization")
        prog.department_id = dept_id

    if program.get("name"): prog.name = program.get("name")
    if program.get("type"): prog.type = program.get("type")
    if program.get("duration_years"): prog.duration_years = int(program.get("duration_years"))
    if program.get("intake_capacity"): prog.intake_capacity = int(program.get("intake_capacity"))

    db.commit()
    db.refresh(prog)
    db.add(AuditLog(user_id=None, action=f"Program updated: {prog.name}", entity_type="Program", entity_id=prog.id))
    db.commit()
    return prog

@router.delete("/programs/{id}", dependencies=[Depends(require_permission("archive_program"))])
def archive_program(id: int, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_unlocked(org_id, db)
    prog = db.query(Program).filter(
        Program.id == id, Program.organization_id == org_id
    ).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    active_courses = db.query(CourseV1).filter(
        CourseV1.program_id == id,
        CourseV1.organization_id == org_id,
        CourseV1.is_active == True
    ).count()
    if active_courses:
        raise HTTPException(status_code=400, detail="Cannot archive program with active courses")
    prog.is_active = False
    db.commit()
    db.add(AuditLog(user_id=None, action=f"Program archived: {prog.name}", entity_type="Program", entity_id=prog.id))
    db.commit()
    return {"archived": True}

@router.get("/courses")
def list_courses(org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    return db.query(CourseV1).filter(
        CourseV1.organization_id == org_id,
        CourseV1.is_active == True
    ).all()

@router.post("/courses", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("create_course"))])
def create_course(course: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_unlocked(org_id, db, None)
    program_id = course.get("program_id")
    code = course.get("code")
    title = course.get("title") or course.get("name")
    name = course.get("name") or course.get("title")
    batch = course.get("batch")
    credits = int(course.get("credits") or 0)
    if not program_id or not code or not title:
        raise HTTPException(status_code=400, detail="program_id, code, title required")
    exists = db.query(CourseV1).filter(
        CourseV1.organization_id == org_id,
        CourseV1.code == code
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="Duplicate course code in organization")
    prog = db.query(Program).filter(
        Program.id == program_id,
        Program.organization_id == org_id,
        Program.is_active == True
    ).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found in organization")
    new_course = CourseV1(
        organization_id=org_id,
        program_id=program_id,
        code=code,
        title=title,
        name=name,
        batch=batch,
        credits=credits
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    db.add(AuditLog(user_id=None, action=f"Course created: {title}", entity_type="Course", entity_id=new_course.id))
    db.commit()
    return new_course

@router.delete("/courses/{id}", dependencies=[Depends(require_permission("archive_course"))])
def archive_course(id: int, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    ensure_unlocked(org_id, db)
    course = db.query(CourseV1).filter(
        CourseV1.id == id, CourseV1.organization_id == org_id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    active_semesters = db.query(SemesterV1).filter(
        SemesterV1.program_id == course.program_id,
        SemesterV1.organization_id == org_id,
        SemesterV1.is_active == True
    ).count()
    if active_semesters:
        raise HTTPException(status_code=400, detail="Cannot archive course while semesters exist in its program")
    course.is_active = False
    db.commit()
    db.add(AuditLog(user_id=None, action=f"Course archived: {course.title}", entity_type="Course", entity_id=course.id))
    db.commit()
    return {"archived": True}

@router.get("/semesters")
def list_semesters(org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    return db.query(SemesterV1).filter(
        SemesterV1.organization_id == org_id,
        SemesterV1.is_active == True
    ).all()

@router.post("/semesters", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("create_semester"))])
def create_semester(data: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    academic_year_id = data.get("academic_year_id")
    ensure_unlocked(org_id, db, academic_year_id)
    program_id = data.get("program_id")
    course_id = data.get("course_id")
    number = data.get("number")
    status_ = data.get("status") or "active"
    if not academic_year_id or not number:
        raise HTTPException(status_code=400, detail="academic_year_id and number required")
    year = db.query(AcademicYear).filter(
        AcademicYear.id == academic_year_id,
        AcademicYear.organization_id == org_id
    ).first()
    if not year or year.locked:
        raise HTTPException(status_code=400, detail="Academic year invalid or locked")
    if program_id:
        prog = db.query(Program).filter(
            Program.id == program_id,
            Program.organization_id == org_id,
            Program.is_active == True
        ).first()
        if not prog:
            raise HTTPException(status_code=404, detail="Program not found")
    if course_id:
        course = db.query(CourseV1).filter(
            CourseV1.id == course_id,
            CourseV1.organization_id == org_id,
            CourseV1.is_active == True
        ).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
    sem = SemesterV1(
        organization_id=org_id,
        program_id=program_id,
        course_id=course_id,
        academic_year_id=academic_year_id,
        number=number,
        status=status_
    )
    db.add(sem)
    db.commit()
    db.refresh(sem)
    db.add(AuditLog(user_id=None, action=f"Semester created: {number}", entity_type="Semester", entity_id=sem.id))
    db.commit()
    return sem

@router.get("/sections")
def list_sections(org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    return db.query(Section).filter(Section.organization_id == org_id, Section.is_active == True).all()

@router.post("/allocations", dependencies=[Depends(require_permission("assign_faculty"))])
def allocate_faculty(data: dict, org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    from models.academic_saas import FacultyAllocation
    faculty_id = data.get("faculty_id")
    scope = data.get("scope")  # "program" | "course" | "semester"
    ref_id = data.get("ref_id")
    role = data.get("role", "lecturer")
    if not faculty_id or not scope or not ref_id:
        raise HTTPException(status_code=400, detail="faculty_id, scope, ref_id required")
    workload = db.query(FacultyAllocation).filter(
        FacultyAllocation.organization_id == org_id,
        FacultyAllocation.faculty_id == faculty_id
    ).count()
    if workload >= 10:
        raise HTTPException(status_code=400, detail="Faculty workload limit reached")
    alloc = FacultyAllocation(
        organization_id=org_id,
        faculty_id=faculty_id,
        role=role
    )
    if scope == "program":
        alloc.program_id = ref_id
    elif scope == "course":
        alloc.course_id = ref_id
    elif scope == "semester":
        alloc.semester_id = ref_id
    else:
        raise HTTPException(status_code=400, detail="Invalid scope")
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    db.add(AuditLog(user_id=faculty_id, action=f"Faculty assigned to {scope} {ref_id}", entity_type="FacultyAllocation", entity_id=alloc.id))
    db.commit()
    return alloc

@router.get("/overview")
def overview(org_id: int = Depends(get_org_id), db: Session = Depends(get_db)):
    depts = db.query(func.count(DepartmentV1.id)).filter(DepartmentV1.organization_id == org_id, DepartmentV1.is_active == True).scalar() or 0
    courses = db.query(func.count(CourseV1.id)).filter(CourseV1.organization_id == org_id, CourseV1.is_active == True).scalar() or 0
    faculty = db.query(func.count(User.id)).filter(User.role == "faculty").scalar() or 0
    try:
        from models.academic_saas import StudentEnrollment
        enrollments = db.query(func.count(StudentEnrollment.id)).filter(StudentEnrollment.organization_id == org_id).scalar() or 0
    except Exception:
        enrollments = 0
    return {
        "total_departments": depts,
        "active_courses": courses,
        "faculty_count": faculty,
        "enrollment_count": enrollments
    }

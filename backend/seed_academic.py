from database import SessionLocal
from models.academic_saas import Organization, AcademicYear, DepartmentV1, CourseV1, Program
from models.academic import Department
from datetime import datetime

def seed_academic():
    db = SessionLocal()
    try:
        # 1. Ensure Organization
        org = db.query(Organization).filter(Organization.id == 1).first()
        if not org:
            org = Organization(id=1, name="Default University", code="DEFUNI", is_active=True)
            db.add(org)
            db.commit()
            print("Created Organization: Default University")

        # 2. Ensure Academic Year
        year = db.query(AcademicYear).filter(AcademicYear.name == "2024-2025").first()
        if not year:
            year = AcademicYear(organization_id=1, name="2024-2025", locked=False, is_active=True)
            db.add(year)
            db.commit()
            print("Created Academic Year: 2024-2025")

        # 3. Seed Departments
        depts = [
            {"name": "Computer Science", "code": "CS", "description": "Dept of CS"},
            {"name": "Information Technology", "code": "IT", "description": "Dept of IT"},
            {"name": "Electronics", "code": "ECE", "description": "Dept of ECE"}
        ]
        
        for d in depts:
            # Seed DepartmentV1 (SaaS structure)
            existing_v1 = db.query(DepartmentV1).filter(DepartmentV1.code == d["code"]).first()
            if not existing_v1:
                new_d = DepartmentV1(
                    organization_id=1,
                    academic_year_id=year.id,
                    name=d["name"],
                    code=d["code"],
                    description=d["description"]
                )
                db.add(new_d)
                print(f"Created DepartmentV1: {d['name']}")
                
            # Seed Department (Legacy structure)
            existing_legacy = db.query(Department).filter(Department.code == d["code"]).first()
            if not existing_legacy:
                new_legacy = Department(
                    name=d["name"],
                    code=d["code"],
                    description=d["description"],
                    status="active"
                )
                db.add(new_legacy)
                print(f"Created Legacy Department: {d['name']}")
        
        db.commit()
        print("Academic seeding complete.")
    except Exception as e:
        print(f"Seeding Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_academic()

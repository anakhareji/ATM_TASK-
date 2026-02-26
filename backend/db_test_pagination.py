from database import SessionLocal
from models.academic_saas import DepartmentV1

db = SessionLocal()
try:
    print("Testing base_q count and offset...")
    q = db.query(DepartmentV1).filter(DepartmentV1.organization_id == 1)
    
    # Check count
    count = q.count()
    print("Count:", count)
    
    # Check standard pagination
    items = q.order_by(DepartmentV1.name.asc()).offset(0).limit(10).all()
    print("Items retrieved:", len(items))

except Exception as e:
    import traceback
    traceback.print_exc()

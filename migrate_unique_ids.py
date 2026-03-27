import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal
from models.user import User
from utils.id_generator import generate_unique_id

db: Session = SessionLocal()

# We only query to get the rows, to generate IDs, then we use raw SQL to update.
# This avoids the NoReferencedTableError with foreign keys in ORM.
users = db.query(User).filter(User.roll_no == None).all()

count = 0
for u in users:
    new_id = generate_unique_id(u.role, db)
    db.execute(
        text("UPDATE users SET roll_no = :roll_no WHERE id = :id"),
        {"roll_no": new_id, "id": u.id}
    )
    count += 1
    print(f"Assigned {new_id} to user {u.id} ({u.name}, {u.role})")

db.commit()
print(f"Successfully migrated {count} users.")
db.close()

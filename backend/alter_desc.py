import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE projects ALTER COLUMN description NVARCHAR(MAX)"))
    conn.commit()
print("ALTERED TABLE")

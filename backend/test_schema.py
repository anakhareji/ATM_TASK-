from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT TOP 1 * FROM projects"))
        print(res.keys())
except Exception as e:
    print(e)

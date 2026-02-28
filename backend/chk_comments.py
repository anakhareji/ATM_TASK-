import traceback
from database import engine, text
with open("chk_res.txt", "w") as f:
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'task_comments'")).fetchall()
            f.write(str([dict(r._mapping) for r in res]))
    except Exception as e:
        f.write(traceback.format_exc())

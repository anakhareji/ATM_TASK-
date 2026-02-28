from database import engine, text
with engine.connect() as conn:
    res = conn.execute(text("SELECT id, title, status, student_id, group_id, faculty_id FROM tasks"))
    print("Tasks in DB:")
    for r in res:
        print(dict(r._mapping))

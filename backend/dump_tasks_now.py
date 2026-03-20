from database import engine, text
with open("tasks_dump.txt", "w") as f:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, title, status, student_id, group_id, faculty_id FROM tasks"))
        f.write("Tasks in DB:\n")
        count = 0
        for r in res:
            f.write(str(dict(r._mapping)) + "\n")
            count += 1
        f.write(f"Total tasks: {count}\n")

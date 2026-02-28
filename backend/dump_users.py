import json
from database import engine, text

with open("out.txt", "w") as f:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, name, email, role FROM users")).fetchall()
        users = [dict(r._mapping) for r in res]
        f.write("USERS:\n" + json.dumps(users, indent=2))
        
        f.write("\n\n--- TASKS ---\n")
        res = conn.execute(text("SELECT * FROM tasks")).fetchall()
        f.write(json.dumps([dict(r._mapping) for r in res], default=str, indent=2))

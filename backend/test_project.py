import json
from jose import jwt
from datetime import datetime, timedelta
import urllib.request
import urllib.error

SECRET_KEY = "CHANGE_THIS_SECRET_KEY"
ALGORITHM = "HS256"

# Create a fake admin token
to_encode = {
    "sub": "1",  # assuming admin ID is 1
    "email": "admin@college.edu",
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(minutes=60)
}
token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

data = json.dumps({
    "title": "Intelligent Urban Traffic Flow Prediction & Management System",
    "description": "Test description",
    "department_id": 1,
    "course_id": "", # Simulating empty string from <select>
    "lead_faculty_id": 2,
    "academic_year": "2024-2026",
    "start_date": "2026-03-27",
    "end_date": "2026-04-15",
    "status": "Published",
    "visibility": "Department Only",
    "allow_tasks": True
}).encode('utf-8')

req = urllib.request.Request("http://localhost:8000/api/admin/projects", data=data, method="POST")
req.add_header("Authorization", f"Bearer {token}")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req) as res:
        print("STATUS", res.status)
except urllib.error.HTTPError as e:
    print("STATUS", e.code)
    try:
        content = e.read().decode()
        d = json.loads(content)
        with open("error_project.log", "w") as f:
            f.write(d.get("detail", str(d)))
    except:
        pass
except Exception as e:
    print("ERR", e)

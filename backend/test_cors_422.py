import sys
import requests
sys.path.append('.')
from utils.security import create_access_token

token = create_access_token({"sub": "admin@college.edu", "role": "admin", "user_id": 1})

data = {
    "title": "Test Task",
    "deadline": "2026-04-23T21:30:00",
    "project_id": 12,
    "task_type": "individual",
    "student_id": 3
}

try:
    res = requests.options("http://localhost:8000/api/tasks", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization,Content-Type"
    })
    print("OPTIONS:", res.status_code, res.headers)
    
    res = requests.post("http://localhost:8000/api/tasks", json=data, headers={"Authorization": f"Bearer {token}", "Origin": "http://localhost:3000"})
    print("POST:", res.status_code, res.headers)
    print("BODY:", res.text)
except Exception as e:
    print("FATAL ERROR:", e)

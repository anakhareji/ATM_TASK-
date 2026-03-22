import sys
import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBhdG0uY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzc0MTY5NTM5fQ.tvk7hemo2yn2-G5ouP-ug11AOsP2anMfVPCBkzntfWc"
payload = {
    "title": "Intelligent Urban Traffic Flow Prediction & Management System",
    "description": "The system analyzes factors...",
    "department_id": 1,
    "course_id": None,
    "lead_faculty_id": 2,
    "academic_year": "2024-2026",
    "start_date": "2026-03-27",
    "end_date": "2026-04-15",
    "status": "Published",
    "visibility": "Department Only",
    "allow_tasks": True
}
res = requests.put(
    "http://localhost:8000/api/admin/projects/12",
    json=payload,
    headers={"Authorization": f"Bearer {token}"}
)
print("Status:", res.status_code)
print("Body:", res.text)

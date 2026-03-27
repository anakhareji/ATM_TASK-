import requests
try:
    r = requests.get("http://localhost:8000/api/recognition/stats", timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Headers: {r.headers}")
    print(f"Body: {r.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

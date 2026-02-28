import requests

def test_create_dept():
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {"email": "admin@atm.com", "password": "admin123"}
    
    r = requests.post(login_url, json=login_data)
    token = r.json().get("access_token")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Organization-ID": "1"
    }
    
    # We found Academic Year ID 4 earlier
    dept_data = {
        "name": "Mechanical Engineering",
        "code": "MECH",
        "description": "Mechanical Engineering Department",
        "academic_year_id": 4
    }
    
    url = "http://localhost:8000/api/v1/academic-structure/departments"
    r = requests.post(url, json=dept_data, headers=headers)
    print(f"Status: {r.status_code}")
    print(r.text)

if __name__ == "__main__":
    test_create_dept()

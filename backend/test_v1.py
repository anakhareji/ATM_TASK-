import requests

def test_v1_endpoints():
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {"email": "admin@atm.com", "password": "admin123"}
    
    try:
        r = requests.post(login_url, json=login_data)
        token = r.json().get("access_token")
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Organization-ID": "1"
        }
        
        base_v1 = "http://localhost:8000/api/v1/academic-structure"
        endpoints = ["/programs", "/semesters", "/courses", "/departments"]
        
        for ep in endpoints:
            url = base_v1 + ep
            r = requests.get(url, headers=headers)
            print(f"{ep}: {r.status_code}")
            if r.status_code != 200:
                print(r.text)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_v1_endpoints()

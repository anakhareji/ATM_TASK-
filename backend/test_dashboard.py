import requests

def test_dashboard():
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {"email": "admin@atm.com", "password": "admin123"}
    
    try:
        r = requests.post(login_url, json=login_data)
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}")
            return
        
        token = r.json().get("access_token")
        print(f"Token obtained: {token[:20]}...")
        
        headers = {"Authorization": f"Bearer {token}"}
        stats_url = "http://localhost:8000/api/admin/dashboard-stats"
        r = requests.get(stats_url, headers=headers)
        print(f"Stats Result: {r.status_code}")
        print(r.text)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_dashboard()

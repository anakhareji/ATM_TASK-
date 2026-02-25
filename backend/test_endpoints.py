import requests

# Login first
r = requests.post('http://127.0.0.1:8000/api/auth/login', json={'email': 'admin@test.com', 'password': 'admin123'})
if r.status_code != 200:
    r = requests.post('http://127.0.0.1:8000/api/auth/login', json={'email': 'admin@atm.com', 'password': 'admin123'})

print('Login status:', r.status_code)
data = r.json()
token = data.get('access_token', '')
if not token:
    print('No token. Response:', str(data)[:200])
    print('Trying to list users from DB...')
    exit()

headers = {'Authorization': 'Bearer ' + token}

endpoints = [
    '/api/academic/departments',
    '/api/academic/courses',
    '/api/academic/faculty/workload',
    '/api/admin/users',
]

for url in endpoints:
    res = requests.get('http://127.0.0.1:8000' + url, headers=headers)
    body = res.json()
    count = len(body) if isinstance(body, list) else (body.get('total', '?') if isinstance(body, dict) else '?')
    print(url + ': status=' + str(res.status_code) + ', count=' + str(count))

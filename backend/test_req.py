from jose import jwt
from datetime import datetime, timedelta
import urllib.request
import urllib.error
import json

SECRET_KEY = "CHANGE_THIS_SECRET_KEY"
ALGORITHM = "HS256"

to_encode = {
    "sub": "2",
    "email": "faculty@college.edu",
    "role": "faculty",
    "exp": datetime.utcnow() + timedelta(minutes=60)
}
token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

req = urllib.request.Request("http://localhost:8000/api/faculty/grades")
req.add_header("Authorization", f"Bearer {token}")

try:
    with urllib.request.urlopen(req) as res:
        pass
except urllib.error.HTTPError as e:
    content = e.read().decode()
    try:
        data = json.loads(content)
        with open("error.log", "w") as f:
            f.write(data.get("detail", "No detail"))
    except:
        pass
except Exception as e:
    pass

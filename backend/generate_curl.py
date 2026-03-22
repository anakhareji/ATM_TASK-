import sys
sys.path.append('.')
from utils.security import create_access_token

token = create_access_token(data={"sub": "1", "email": "admin@atm.com", "role": "admin"})
print(token)

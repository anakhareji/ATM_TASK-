import urllib.request
import traceback
try:
    urllib.request.urlopen("http://localhost:8000/api/tasks/6/submissions")
except Exception as e:
    with open("x.txt", "w") as f:
        f.write(traceback.format_exc())

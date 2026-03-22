import urllib.request
import zlib
import base64
import re

def encode_puml(text):
    zlibbed_str = zlib.compress(text.encode('utf-8'))
    compressed = zlibbed_str[2:-4]
    b64 = base64.b64encode(compressed).decode('ascii')
    maketrans = str.maketrans('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                              '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_')
    return b64.translate(maketrans)

diagram_system_if = """@startuml
skinparam monochrome true
skinparam shadowing false

|User|
|System|

|User|
start
:Enter Login Credentials;

|System|
:Validate Credentials;

if (Valid?) then (Yes)
  :Generate Auth;
  |User|
  :Dashboard;
  stop
else (No)
  :Reject;
  |User|
  :Error;
  stop
endif
@enduml
"""

diagram_user_if = """@startuml
skinparam monochrome true
skinparam shadowing false

|User|
|System|

|User|
start
:Enter Login Credentials;

|System|
:Validate Credentials;

|User|
if (Valid?) then (Yes)
  |System|
  :Generate Auth;
  |User|
  :Dashboard;
  stop
else (No)
  |System|
  :Reject;
  |User|
  :Error;
  stop
endif
@enduml
"""

diagram_detach = """@startuml
skinparam monochrome true
skinparam shadowing false

|User|
|System|

|User|
start
:Enter Login Credentials;

|System|
:Validate Credentials;

if (Valid?) then (Yes)
  :Generate Auth;
  |User|
  :Dashboard;
  detach
else (No)
  :Reject;
  |User|
  :Error;
  detach
endif
@enduml
"""

import sys

for name, code in [("System_If", diagram_system_if), ("User_If", diagram_user_if), ("Detach", diagram_detach)]:
    encoded = encode_puml(code)
    url = f"http://www.plantuml.com/plantuml/svg/~1{encoded}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        content = response.read().decode('utf-8')
        if "java.lang.IllegalArgumentException" in content or "Crash" in content:
            print(f"{name}: CRASH")
        elif "Syntax Error" in content:
            print(f"{name}: SYNTAX ERROR")
        else:
            print(f"{name}: SUCCESS")
    except Exception as e:
        print(f"{name}: HTTP ERROR {e}")

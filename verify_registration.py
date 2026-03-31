import requests
import json
from datetime import date

def test_register(username, start_date, internship_type, end_date=None):
    url = "http://127.0.0.1:8000/api/auth/register/"
    data = {
        "username": username,
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
        "email": f"{username}@test.com",
        "role": "INTERN",
        "major": "IT",
        "start_date": start_date,
        "internship_type": internship_type
    }
    if end_date:
        data["end_date"] = end_date
        
    response = requests.post(url, json=data)
    print(f"Testing {internship_type}: {response.status_code}")
    if response.status_code == 201:
        print(f"Success: {username}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_register("bts_user", "2026-04-01", "BTS")
    test_register("uni_user_fail", "2026-04-01", "UNIVERSITY", "2026-07-01") # Should fail (3 months)
    test_register("uni_user_pass", "2026-04-01", "UNIVERSITY", "2026-05-15") # Should pass (1.5 months)

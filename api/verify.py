import json
import os

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": json.dumps({"error": "Method Not Allowed"})
        }

    try:
        body = request.json
    except Exception:
        body = json.loads(request.body)

    username_input = body.get("username")
    password_input = body.get("password")

    current_username = os.getenv('USERNAME')
    current_password = os.getenv('PASSWORD')

    print("INPUT username:", repr(username_input))
    print("INPUT password:", repr(password_input))
    print("ENV username:", repr(current_username))
    print("ENV password:", repr(current_password))

    if (
        current_username and username_input and
        current_username.strip().lower() == username_input.strip().lower() and
        current_password and password_input and
        current_password.strip() == password_input.strip()
    ):
        return {
            "statusCode": 200,
            "body": json.dumps({"success": True})
        }
    else:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": "Username atau password salah!"})
        }

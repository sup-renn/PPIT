from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route("/api/verify", methods=["POST"])
def verify():
    data = request.json
    username_input = data.get('username')
    password_input = data.get('password')

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
        return jsonify({"success": True}), 200
    else:
        return jsonify({"error": "Username atau password salah!"}), 401

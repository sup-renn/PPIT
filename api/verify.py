from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/', methods=['POST'])  # 👈 IMPORTANT: must be '/'
def verify():
    data = request.json
    username_input = data.get('username')
    password_input = data.get('password')

    current_username = os.getenv('USERNAME')
    current_password = os.getenv('PASSWORD')

    if current_username == username_input and current_password == password_input:
        return jsonify({'success': True}), 200
    else:
        return jsonify({'error': 'Kesalahan terjadi di username atau password'}), 401

# Vercel Python serverless expects 'app' as the handler:
handler = app

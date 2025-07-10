
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from dotenv import load_dotenv, set_key, find_dotenv
from urllib.parse import urlparse
import os
import uuid

load_dotenv()

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads/events'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mainpage')
def mainpage() :
    return render_template('mainpage.html')

@app.route('/upload-event-image', methods=['POST'])
def upload_event_image():
    try:
        if 'eventImage' not in request.files:
            return jsonify({'error': 'No file selected'}), 400
        
        file = request.files['eventImage']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            image_url = f"/static/uploads/events/{unique_filename}"
            
            return jsonify({
                'success': True,
                'imageUrl': image_url,
                'filename': unique_filename
            })
        else:
            return jsonify({'error': 'Invalid file type. Please upload PNG, JPG, JPEG, GIF, or WEBP files.'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/static/uploads/events/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/delete-event/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        data = request.json
        image_url = data.get('imageUrl', '')
        
        if image_url and '/static/uploads/events/' in image_url:
            parsed_url = urlparse(image_url)
            filename = os.path.basename(parsed_url.path)
            
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Deleted file: {file_path}")
            else:
                print(f"File not found: {file_path}")
        
        return jsonify({
            'success': True, 
            'message': 'Event and associated image deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting event: {str(e)}")
        return jsonify({'error': f'Failed to delete event: {str(e)}'}), 500



@app.route('/change-password', methods=['POST'])
def change_password():
    data = request.json 
    old = data.get('oldPassword')
    new = data.get('newPassword')
    confirm = data.get('confirmPassword')

    current = os.getenv('PASSWORD')

    if old != current:
        return jsonify({'error': 'Password lama tidak sesuai!'}), 400

    if new != confirm:
        return jsonify({'error': 'Password baru dan konfirmasi tidak sama!'}), 400

    if len(new) < 6:
        return jsonify({'error': 'Password baru minimal 6 karakter!'}), 400
    
    envfile = find_dotenv()
    if not envfile :
        envfile = '.env'
    
    set_key(envfile, 'PASSWORD', new)

    os.environ['PASSWORD'] = new

    return jsonify({'success': True})

@app.route("/verify", methods=['POST'])
def verify():
    data = request.json
    username_input = data.get('username')
    password_input = data.get('password')

    current_username = os.getenv('USERNAME')
    current_password = os.getenv('PASSWORD')

    if current_username == username_input and current_password == password_input :
        return jsonify({'success': True}), 200
    else :
        return jsonify({'error': 'Kesalahan terjadi di username atau password'}), 401
    
if __name__ == '__main__':
    app.run(debug=True)

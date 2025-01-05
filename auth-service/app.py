from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
import boto3

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key'
jwt = JWTManager(app)

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')  # Change as per AWS region
user_table = dynamodb.Table('Users')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']
    user_table.put_item(Item={'username': username, 'password': password})
    return jsonify(message="User registered successfully"), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']
    response = user_table.get_item(Key={'username': username})
    if 'Item' in response and response['Item']['password'] == password:
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    return jsonify(message="Invalid credentials"), 401

@app.route('/validate', methods=['GET'])
@jwt_required()
def validate():
    return jsonify(message="Token is valid"), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

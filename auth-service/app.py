import boto3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# AWS DynamoDB Client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
user_table = dynamodb.Table('Users')

@app.route('/signup', methods=['POST'])
def signup():
    # Sign up a new user and store their details in DynamoDB.
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Check if the username already exists
    response = user_table.get_item(Key={'username': username})
    if 'Item' in response:
        return jsonify({'error': 'Username already exists'}), 400

    # Add the new user to the table
    user_table.put_item(Item={'username': username, 'password': password})
    return jsonify({'message': 'User created successfully!'}), 201

@app.route('/login', methods=['POST'])
def login():
    # Authenticate user by validating against DynamoDB.
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Query DynamoDB for the user
    response = user_table.get_item(Key={'username': username})
    user = response.get('Item')

    if user and user['password'] == password:
        return jsonify({'message': f'Welcome, {username}! You are logged in.'}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/users/<username>', methods=['DELETE'])
def delete_user(username):
    # Delete a user from the Users table
    try:
        user_table.delete_item(Key={'username': username})
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

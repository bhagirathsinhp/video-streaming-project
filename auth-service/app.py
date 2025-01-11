import boto3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# AWS DynamoDB Client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')  # Replace with your AWS region
user_table = dynamodb.Table('Users')

@app.route('/signup', methods=['POST'])
def signup():
    """Sign up a new user and store their details in DynamoDB."""
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
    """Authenticate user by validating against DynamoDB."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Query DynamoDB for the user with both username and password
    response = user_table.get_item(Key={'username': username, 'password': password})
    user = response.get('Item')

    if user:
        return jsonify({'message': f'Welcome, {username}! You are logged in.'}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/protected', methods=['GET'])
def protected():
    """Example of a protected route."""
    username = request.args.get('username')
    password = request.args.get('password')

    if username and password:
        response = user_table.get_item(Key={'username': username, 'password': password})
        if 'Item' in response:
            return jsonify({'message': f'Hello, {username}! Access granted.'}), 200

    return jsonify({'error': 'Unauthorized access'}), 401

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

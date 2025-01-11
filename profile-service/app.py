from flask import Flask, request, jsonify
import boto3
import requests
from botocore.exceptions import ClientError
from flask_cors import CORS

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# AWS Configuration
AWS_REGION = "us-east-1"
DYNAMODB_TABLE = "UserProfiles"
AUTH_SERVICE_URL = "http://174.129.100.156:5000"  # Update with actual Auth Service URL

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
profiles_table = dynamodb.Table(DYNAMODB_TABLE)

@app.route('/profile/<username>', methods=['GET'])
def get_profile(username):
    # Fetch a user profile by username
    try:
        response = profiles_table.get_item(Key={'username': username})
        if 'Item' not in response:
            return jsonify({'message': 'User profile not found'}), 404
        return jsonify(response['Item']), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/profile', methods=['POST'])
def create_profile():
    # Create a new user profile
    data = request.json
    username = data.get('username')
    name = data.get('name')
    email = data.get('email')
    preferences = data.get('preferences', {})
    notifications = data.get('notifications', True)

    if not username or not name or not email:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        profiles_table.put_item(
            Item={
                'username': username,
                'name': name,
                'email': email,
                'preferences': preferences,
                'notifications': notifications,
            }
        )
        return jsonify({'message': 'User profile created successfully'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/profile/<username>', methods=['PUT'])
def update_profile(username):
    # Update a user profile
    data = request.json
    updates = {}

    # Collect fields to update
    for field in ['name', 'email', 'preferences', 'notifications']:
        if field in data:
            updates[field] = data[field]

    if not updates:
        return jsonify({'error': 'No updates provided'}), 400

    try:
        # Use ExpressionAttributeNames for reserved keywords
        update_expression = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
        expression_attribute_names = {f"#{k}": k for k in updates.keys()}
        expression_attribute_values = {f":{k}": v for k, v in updates.items()}

        profiles_table.update_item(
            Key={'username': username},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        return jsonify({'message': 'Profile updated successfully'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/profile/<username>', methods=['DELETE'])
def delete_profile(username):
    # Delete a user profile and notify the Auth Service
    try:
        # Delete profile from UserProfiles table
        profiles_table.delete_item(Key={'username': username})

        # Notify Auth Service to delete user from Users table
        auth_response = requests.delete(f"{AUTH_SERVICE_URL}/users/{username}")
        if auth_response.status_code != 200:
            return jsonify({
                'message': 'Profile deleted, but failed to delete user in Auth Service',
                'error': auth_response.json()
            }), 500

        return jsonify({'message': 'User profile and authentication data deleted successfully'}), 200

    except ClientError as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
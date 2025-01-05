from flask import Flask, request, jsonify
import jwt
import datetime
from functools import wraps
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')  # Adjust region as needed
table_name = 'Users'
users_table = dynamodb.Table(table_name)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Check if user already exists
    try:
        response = users_table.get_item(Key={'username': username})
        if 'Item' in response:
            return jsonify({'message': 'User already exists!'}), 400
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

    # Add user to DynamoDB
    try:
        users_table.put_item(Item={'username': username, 'password': password})
        return jsonify({'message': 'User registered successfully!'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Retrieve user from DynamoDB
    try:
        response = users_table.get_item(Key={'username': username})
        if 'Item' not in response or response['Item']['password'] != password:
            return jsonify({'message': 'Invalid credentials!'}), 401
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

    # Generate JWT token
    token = jwt.encode({'user': username, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
                       app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({'token': token})

@app.route('/validate', methods=['GET'])
@token_required
def validate():
    return jsonify({'message': 'Token is valid!'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

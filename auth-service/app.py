from flask import Flask, request, jsonify
import jwt
import datetime
from functools import wraps
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')

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
    try:
        users_table.put_item(
            Item={
                'username': data['username'],
                'password': data['password']  # For simplicity; use hashed passwords in production
            }
        )
        return jsonify({'message': 'User registered successfully!'}), 201
    except ClientError as e:
        return jsonify({'message': 'Error registering user', 'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    try:
        response = users_table.get_item(Key={'username': data['username']})
        if 'Item' not in response or response['Item']['password'] != data['password']:
            return jsonify({'message': 'Invalid credentials!'}), 401
        token = jwt.encode({'user': data['username'], 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
                           app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token})
    except ClientError as e:
        return jsonify({'message': 'Error logging in', 'error': str(e)}), 500

@app.route('/validate', methods=['GET'])
@token_required
def validate():
    return jsonify({'message': 'Token is valid!'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

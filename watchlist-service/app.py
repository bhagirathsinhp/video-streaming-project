from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError

# Initialize Flask App
app = Flask(__name__)

# AWS Configuration
AWS_REGION = "us-east-1"
DYNAMODB_TABLE = "Watchlist"

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
watchlist_table = dynamodb.Table(DYNAMODB_TABLE)

@app.route('/watchlist', methods=['GET'])
def get_watchlist():
    """
    Fetch the watchlist for a user.
    """
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Missing username parameter'}), 400

    try:
        response = watchlist_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('username').eq(username)
        )
        return jsonify(response.get('Items', [])), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/watchlist', methods=['POST'])
def add_to_watchlist():
    """
    Add a video to the user's watchlist.
    """
    data = request.json
    username = data.get('username')
    video_id = data.get('videoId')

    if not username or not video_id:
        return jsonify({'error': 'Missing username or videoId'}), 400

    try:
        watchlist_table.put_item(
            Item={
                'username': username,
                'videoId': video_id,
                'addedAt': boto3.dynamodb.types.DYNAMODB_CONTEXT.create_decimal_from_float(
                    float(request.json.get('addedAt', ''))
                ),
            }
        )
        return jsonify({'message': 'Video added to watchlist'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/watchlist/<video_id>', methods=['DELETE'])
def remove_from_watchlist(video_id):
    """
    Remove a video from the user's watchlist.
    """
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Missing username parameter'}), 400

    try:
        watchlist_table.delete_item(
            Key={
                'username': username,
                'videoId': video_id
            }
        )
        return jsonify({'message': 'Video removed from watchlist'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

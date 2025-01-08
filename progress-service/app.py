from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError

# Initialize Flask App
app = Flask(__name__)

# AWS Configuration
AWS_REGION = "us-east-1"
DYNAMODB_TABLE = "Progress"

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
progress_table = dynamodb.Table(DYNAMODB_TABLE)

@app.route('/progress/<username>', methods=['GET'])
def get_progress(username):

    #Fetch progress for a specific user.
    try:
        response = progress_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('username').eq(username)
        )
        return jsonify(response.get('Items', [])), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/progress/<username>', methods=['PUT'])
def update_progress(username):
  
    #Update progress for a specific user.
    data = request.json
    course_id = data.get('courseId')
    videos_watched = data.get('videosWatched', [])
    progress_percentage = data.get('progressPercentage')

    if not course_id or progress_percentage is None:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Update the user's progress
        progress_table.put_item(
            Item={
                'username': username,
                'courseId': course_id,
                'videosWatched': videos_watched,
                'progressPercentage': progress_percentage,
            }
        )
        return jsonify({'message': 'Progress updated successfully'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/progress/<username>', methods=['DELETE'])
def delete_progress(username):

    #Clear all progress for a specific user.
    try:
        # Query all progress for the user
        response = progress_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('username').eq(username)
        )
        for item in response.get('Items', []):
            progress_table.delete_item(
                Key={
                    'username': item['username'],
                    'courseId': item['courseId']
                }
            )
        return jsonify({'message': 'Progress cleared successfully'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
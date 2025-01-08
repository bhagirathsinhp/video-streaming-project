from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timezone

# Initialize Flask App
app = Flask(__name__)

# AWS Configuration
AWS_REGION = "us-east-1" 
DYNAMODB_TABLE = "Discussions"

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
discussions_table = dynamodb.Table(DYNAMODB_TABLE)

@app.route('/forum/<course_id>', methods=['POST'])
def start_discussion(course_id):

    # Start a new discussion for a course. 
    data = request.json
    discussion_id = data.get('discussionId')
    title = data.get('title')
    content = data.get('content')
    author = data.get('author')

    if not discussion_id or not title or not content or not author:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        discussions_table.put_item(
            Item={
                'courseId': course_id,
                'discussionId': discussion_id,
                'title': title,
                'content': content,
                'author': author,
                'replies': [],
                'createdAt': datetime.now(timezone.utc).isoformat(),
            }
        )
        return jsonify({'message': 'Discussion created successfully'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/forum/<course_id>', methods=['GET'])
def get_discussions(course_id):

    # Retrieve all discussions for a specific course.
    try:
        response = discussions_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('courseId').eq(course_id)
        )
        return jsonify(response.get('Items', [])), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/forum/<course_id>/<discussion_id>/reply', methods=['POST'])
def add_reply(course_id, discussion_id):

    # Add a reply to a specific discussion.
    data = request.json
    reply_id = data.get('replyId')
    content = data.get('content')
    author = data.get('author')

    if not reply_id or not content or not author:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Fetch the discussion
        response = discussions_table.get_item(Key={'courseId': course_id, 'discussionId': discussion_id})
        if 'Item' not in response:
            return jsonify({'error': 'Discussion not found'}), 404

        discussion = response['Item']
        replies = discussion.get('replies', [])
        replies.append({
            'replyId': reply_id,
            'content': content,
            'author': author,
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })

        # Update the discussion with the new reply
        discussions_table.update_item(
            Key={'courseId': course_id, 'discussionId': discussion_id},
            UpdateExpression="SET replies = :r",
            ExpressionAttributeValues={':r': replies}
        )
        return jsonify({'message': 'Reply added successfully'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/forum/<course_id>/<discussion_id>', methods=['DELETE'])
def delete_discussion(course_id, discussion_id):

    # Delete a discussion for a specific course.
    try:
        discussions_table.delete_item(Key={'courseId': course_id, 'discussionId': discussion_id})
        return jsonify({'message': 'Discussion deleted successfully'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
from flask_cors import CORS

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# AWS Configuration
AWS_REGION = "us-east-1" 
DYNAMODB_TABLE = "Courses"

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
courses_table = dynamodb.Table(DYNAMODB_TABLE)

@app.route('/courses', methods=['GET'])
def get_courses():

    #Retrieve all courses.
    try:
        response = courses_table.scan()
        return jsonify(response.get('Items', [])), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/courses/<course_id>', methods=['GET'])
def get_course(course_id):

    #Retrieve a specific course by courseId.
    try:
        response = courses_table.get_item(Key={'courseId': course_id})
        if 'Item' not in response:
            return jsonify({'message': 'Course not found'}), 404
        return jsonify(response['Item']), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/courses', methods=['POST'])
def add_course():

    #Add a new course.
    data = request.json
    course_id = data.get('courseId')
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    videos = data.get('videos', [])

    if not course_id or not title or not description or not category:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        courses_table.put_item(
            Item={
                'courseId': course_id,
                'title': title,
                'description': description,
                'category': category,
                'videos': videos
            }
        )
        return jsonify({'message': 'Course added successfully'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/courses/<course_id>', methods=['PUT'])
def update_course(course_id):

    #Update a course.
    data = request.json
    updates = {}

    # Collect fields to update
    for field in ['title', 'description', 'category', 'videos']:
        if field in data:
            updates[field] = data[field]

    if not updates:
        return jsonify({'error': 'No updates provided'}), 400

    try:
        # Update the course
        update_expression = "SET " + ", ".join(f"{k} = :{k}" for k in updates.keys())
        expression_values = {f":{k}": v for k, v in updates.items()}

        courses_table.update_item(
            Key={'courseId': course_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        return jsonify({'message': 'Course updated successfully'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):

    #Delete a course by courseId.
    try:
        courses_table.delete_item(Key={'courseId': course_id})
        return jsonify({'message': 'Course deleted successfully'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
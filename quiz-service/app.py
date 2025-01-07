from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import openai
from datetime import datetime, timezone

# Initialize Flask App
app = Flask(__name__)

# AWS Configuration
AWS_REGION = "us-east-1"
DYNAMODB_TABLE = "Quizzes"

# OpenAI API Key
openai.api_key = "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"

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
quizzes_table = dynamodb.Table(DYNAMODB_TABLE)

# Predefined question bank for fallback
PREDEFINED_QUESTIONS = [
    {
        "question": "What is the capital of France?",
        "options": ["Paris", "London", "Berlin"],
        "correctAnswer": 0
    },
    {
        "question": "Which language is primarily spoken in Brazil?",
        "options": ["Portuguese", "Spanish", "French"],
        "correctAnswer": 0
    }
]

@app.route('/quizzes/generate', methods=['POST'])
def generate_quiz():

    #Generate a quiz using AI or fetch a cached quiz from DynamoDB.
    data = request.json
    course_id = data.get('courseId')
    num_questions = data.get('numQuestions', 5)
    topics = data.get('topics', [])
    difficulty = data.get('difficulty', 'medium').lower()

    if not course_id:
        return jsonify({'error': 'Missing courseId'}), 400

    try:
        # Check for a cached quiz in DynamoDB
        response = quizzes_table.scan(
            FilterExpression="courseId = :courseId AND topics = :topics",
            ExpressionAttributeValues={
                ':courseId': course_id,
                ':topics': ', '.join(topics) if topics else 'General'
            }
        )
        if response['Items']:
            return jsonify({'message': 'Cached quiz retrieved', 'quiz': response['Items'][0]}), 200

        # Generate quiz using AI
        prompt = f"Generate {num_questions} {difficulty} quiz questions for the course '{course_id}'. Topics: {', '.join(topics) if topics else 'General'}."
        ai_response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=500
        )

        # Parse AI response
        questions = ai_response.choices[0].text.strip().split('\n')
        formatted_questions = []
        for question in questions:
            if ':' in question:
                q, options = question.split(':', 1)
                options = options.split(',')
                formatted_questions.append({
                    "question": q.strip(),
                    "options": [o.strip() for o in options],
                    "correctAnswer": 0  # Assume first option is correct; refine if needed
                })

        # Save the quiz to DynamoDB
        quiz_id = f"quiz-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        quizzes_table.put_item(
            Item={
                'courseId': course_id,
                'quizId': quiz_id,
                'title': f"AI-Generated Quiz for {course_id}",
                'questions': formatted_questions,
                'topics': topics,
                'createdAt': datetime.now(timezone.utc).isoformat()
            }
        )

        return jsonify({
            'message': 'Quiz generated successfully!',
            'quizId': quiz_id,
            'questions': formatted_questions
        }), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        # Fallback to predefined questions
        return jsonify({
            'message': 'Quiz generated using predefined questions due to an error.',
            'quizId': None,
            'questions': PREDEFINED_QUESTIONS,
            'error': str(e)
        }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
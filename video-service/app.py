from flask import Flask, jsonify
import boto3
from botocore.exceptions import ClientError
import re

app = Flask(__name__)

# AWS Configuration
AWS_REGION = 'us-east-1'  
S3_BUCKET_NAME = 'dread-project-videos-bucket-2615473'  
DYNAMODB_TABLE = 'Videos'  

# Initialize AWS Services
s3 = boto3.client('s3', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
videos_table = dynamodb.Table(DYNAMODB_TABLE)

@app.route('/videos', methods=['GET'])
def get_all_videos():
    
    #Fetch metadata for all videos.
    try:
        response = videos_table.scan()
        return jsonify(response.get('Items', [])), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    """
    Fetch metadata for a specific video.
    """
    try:
        response = videos_table.get_item(Key={'videoId': video_id})
        if 'Item' not in response:
            return jsonify({'message': 'Video not found!'}), 404
        return jsonify(response['Item']), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/videos/<video_id>/stream', methods=['GET'])
def stream_video(video_id):
   
    try:
        # Fetch video list from S3
        response = s3.list_objects_v2(Bucket=S3_BUCKET_NAME)
        if 'Contents' not in response:
            return jsonify({'message': 'No videos found in S3.'}), 404

        video_files = [obj['Key'] for obj in response['Contents']]

        # Populate DynamoDB for each video
        for original_file_name in video_files:
            # Generate a clean videoId
            video_id = re.sub(r'[^\w\s-]', '', original_file_name)  # Remove special characters
            video_id = video_id.replace(' ', '-').lower()  # Replace spaces with hyphens and lowercase

            try:
                # Check if video already exists in DynamoDB
                existing = videos_table.get_item(Key={'videoId': video_id})
                if 'Item' not in existing:
                    # Add new video metadata
                    videos_table.put_item(
                        Item={
                            'videoId': video_id,
                            'title': original_file_name.replace('.mp4', ''),  # Preserve original title without extension
                            'description': 'Default description for the video.',
                            'duration': 'Unknown',  # Duration can be updated later
                            'category': 'General',  # Assign a default category
                        }
                    )
            except ClientError as e:
                print(f"Error syncing video {original_file_name}: {e}")
                continue

        return jsonify({'message': 'Videos synced successfully!'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
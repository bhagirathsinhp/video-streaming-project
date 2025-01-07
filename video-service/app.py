from flask import Flask, jsonify
import boto3
from botocore.exceptions import ClientError

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
   
    #Generate a pre-signed URL for streaming a video from S3.
    try:
        # Generate a pre-signed URL for the video
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': f'{video_id}.mp4'},
            ExpiresIn=3600  # URL valid for 1 hour
        )
        return jsonify({'streamUrl': url}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500


@app.route('/videos/sync', methods=['POST'])
def sync_videos():

    #Fetch all videos from S3 and update the Videos table in DynamoDB dynamically.

    try:
        # Fetch video files from S3 bucket
        response = s3.list_objects_v2(Bucket=S3_BUCKET_NAME)
        if 'Contents' not in response:
            return jsonify({'message': 'No videos found in the S3 bucket.'}), 404

        video_ids = [obj['Key'].replace('.mp4', '') for obj in response['Contents']]

        # Update DynamoDB for each video
        for video_id in video_ids:
            # Check if video already exists
            existing_video = videos_table.get_item(Key={'videoId': video_id})
            if 'Item' in existing_video:
                print(f"Video {video_id} already exists. Skipping...")
                continue

            # Add new video metadata
            videos_table.put_item(
                Item={
                    'videoId': video_id,
                    'title': video_id.replace('-', ' ').replace('_', ' ').title(),
                    'description': 'Default description for the video.',
                    'duration': 'Unknown',
                    'category': 'General'
                }
            )
            print(f"Added metadata for video: {video_id}")

        return jsonify({'message': 'Videos table synchronized successfully.'}), 200

    except ClientError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
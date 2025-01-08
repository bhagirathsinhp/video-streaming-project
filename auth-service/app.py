from flask import Flask, request, jsonify
from functools import wraps
from jose import jwt
import requests

app = Flask(__name__)

# Auth0 Configuration
AUTH0_DOMAIN = 'dev-jvzjqeroel1nngi8.us.auth0.com'
API_AUDIENCE = 'https://dev-jvzjqeroel1nngi8.us.auth0.com/api/v2/'
ALGORITHMS = ['RS256']

def get_public_key(token):
 
    # Fetch public keys from Auth0 to verify the JWT token.
    jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
    response = requests.get(jwks_url)
    jwks = response.json()

    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    for key in jwks['keys']:
        if key['kid'] == unverified_header['kid']:
            rsa_key = {
                'kty': key['kty'],
                'kid': key['kid'],
                'use': key['use'],
                'n': key['n'],
                'e': key['e']
            }
    return rsa_key

def token_required(f):

    # Middleware to validate JWT tokens in incoming requests.
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', None)
        if not token:
            return jsonify({'error': 'Authorization header missing'}), 401

        token = token.split(' ')[1]  # Remove "Bearer"
        try:
            rsa_key = get_public_key(token)
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=API_AUDIENCE,
                issuer=f'https://{AUTH0_DOMAIN}/'
            )
            request.user = payload  # Attach the user payload to the request
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.JWTClaimsError:
            return jsonify({'error': 'Invalid claims'}), 401
        except Exception as e:
            return jsonify({'error': f'Token validation failed: {e}'}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/validate', methods=['GET'])
@token_required
def validate():

    # Example of a protected route.
    user = request.user
    return jsonify({'message': f'Hello, {user["sub"]}! Token is valid.'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
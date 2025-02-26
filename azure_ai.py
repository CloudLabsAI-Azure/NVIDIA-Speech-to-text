import urllib.request
import json
import os
import ssl
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def allowSelfSignedHttps(allowed):
    # bypass the server certificate verification on client side
    if allowed and not os.environ.get('PYTHONHTTPSVERIFY', '') and getattr(ssl, '_create_unverified_context', None):
        ssl._create_default_https_context = ssl._create_unverified_context

def process_with_azure_ai(text_data):
    """Process text data with Azure AI Foundry"""
    allowSelfSignedHttps(True)  # Allow self-signed certificates

    # Create request data with the required 'question' field
    data = {
        "question": text_data
    }

    body = str.encode(json.dumps(data))

    # Get endpoint URL and API key from environment variables
    url = os.getenv('AZURE_ENDPOINT_URL')
    api_key = os.getenv('AZURE_API_KEY')

    if not url:
        return {"error": "Azure endpoint URL not configured in .env file"}
    
    if not api_key:
        return {"error": "Azure API key not configured in .env file"}

    headers = {'Content-Type': 'application/json', 'Authorization': ('Bearer ' + api_key)}
    req = urllib.request.Request(url, body, headers)

    try:
        response = urllib.request.urlopen(req)
        result = response.read().decode('utf-8')
        return json.loads(result)
    except urllib.error.HTTPError as error:
        error_message = f"Request failed with status code: {error.code}"
        try:
            error_details = json.loads(error.read().decode("utf8", 'ignore'))
            return {"error": error_message, "details": error_details}
        except:
            error_details = error.read().decode("utf8", 'ignore')
            return {"error": error_message, "details": error_details}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

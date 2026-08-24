import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
import io

client = TestClient(app)

def test_stt_invalid_file_type():
    # Sending a text file instead of audio
    response = client.post(
        "/api/speech-to-text",
        files={"audio": ("test.txt", io.BytesIO(b"not audio"), "text/plain")}
    )
    assert response.status_code == 400
    assert "Must be an audio file" in response.json()["detail"]

def test_stt_empty_audio_file():
    # Sending an empty audio file
    response = client.post(
        "/api/speech-to-text",
        files={"audio": ("empty.webm", io.BytesIO(b""), "audio/webm")}
    )
    assert response.status_code == 400
    assert "Empty audio file" in response.json()["detail"]

@patch("app.api.routers.stt.genai.Client")
def test_stt_success_mocked(MockClient):
    # Setup mock
    mock_instance = MockClient.return_value
    mock_response = MagicMock()
    mock_response.text = "add two packets of Maggi to my shopping list"
    mock_instance.models.generate_content.return_value = mock_response

    # Send a tiny valid-looking audio payload
    response = client.post(
        "/api/speech-to-text",
        files={"audio": ("audio.webm", io.BytesIO(b"fake audio data"), "audio/webm")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "add two packets of Maggi to my shopping list"
    
    # Verify the client was called properly
    mock_instance.models.generate_content.assert_called_once()


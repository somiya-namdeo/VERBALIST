import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    response = client.post("/api/dev/login")
    if response.status_code == 200 and "access_token" in response.json():
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    return {}

@patch("app.api.routers.agent.VerbalistAgent")
def test_text_to_chat(MockAgent, auth_headers):
    instance = MockAgent.return_value
    instance.chat.return_value = {"response": "Added Maggi to your list.", "tools_used": ["add_to_shopping_list"], "session_id": "test", "found_products": []}
    
    response = client.post("/api/agent/chat", json={"message": "Add Maggi"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["response"] == "Added Maggi to your list."
    assert "add_to_shopping_list" in response.json()["tools_used"]

@patch("app.api.routers.agent.VerbalistAgent")
@patch("app.api.routers.stt.genai.Client")
def test_voice_to_chat_flow(MockClient, MockAgent, auth_headers):
    mock_instance = MockClient.return_value
    mock_response = MagicMock()
    mock_response.text = "Find organic tomatoes"
    mock_instance.models.generate_content.return_value = mock_response

    import io
    stt_response = client.post(
        "/api/speech-to-text",
        files={"audio": ("audio.webm", io.BytesIO(b"fake audio"), "audio/webm")}
    )
    assert stt_response.status_code == 200
    transcribed_text = stt_response.json()["text"]
    assert transcribed_text == "Find organic tomatoes"

    agent_instance = MockAgent.return_value
    agent_instance.chat.return_value = {"response": "Here are organic tomatoes.", "tools_used": ["search_products"], "session_id": "test2", "found_products": []}
    
    chat_response = client.post("/api/agent/chat", json={"message": transcribed_text}, headers=auth_headers)
    assert chat_response.status_code == 200
    assert chat_response.json()["response"] == "Here are organic tomatoes."
    assert "search_products" in chat_response.json()["tools_used"]

def test_user_id_leakage():
    from app.agent.schemas import ChatResponse
    fields = ChatResponse.model_fields.keys() if hasattr(ChatResponse, 'model_fields') else ChatResponse.__fields__.keys()
    assert "user_id" not in fields

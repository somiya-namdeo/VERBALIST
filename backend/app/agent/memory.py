from typing import Dict, List, Any

class MemoryStore:
    def __init__(self, max_turns: int = 3):
        self.max_turns = max_turns
        self.sessions: Dict[str, List[Any]] = {}

    def get_history(self, session_id: str) -> List[Any]:
        return self.sessions.get(session_id, [])

    def save_history(self, session_id: str, history: List[Any]):
        # Keep only the last max_turns * 2 messages (1 turn = user + model)
        self.sessions[session_id] = history[-(self.max_turns * 2):]

# In-memory store instance
memory_store = MemoryStore()

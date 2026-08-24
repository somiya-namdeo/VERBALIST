import requests
import json
from app.core.config import settings
from app.api.dependencies import AuthenticatedUser
from app.agent.tools import VerbalistTools
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.memory import memory_store
import uuid


class VerbalistAgent:
    def __init__(self, auth: AuthenticatedUser, session_id: str = None):
        self.auth = auth
        self.session_id = session_id or str(uuid.uuid4())
        self.tools = VerbalistTools(auth)
        self.api_key = settings.GROQ_LLM_API_KEY
        self.model = settings.GROQ_LLM_MODEL
        
    def _get_callable_tools(self):
        return {
            "search_products": self.tools.search_products,
            "get_product": self.tools.get_product,
            "find_substitutes": self.tools.find_substitutes,
            "find_seasonal_products": self.tools.find_seasonal_products,
            "recommend_products": self.tools.recommend_products,
            "get_shopping_list": self.tools.get_shopping_list,
            "add_to_shopping_list": self.tools.add_to_shopping_list,
            "update_shopping_list": self.tools.update_shopping_list,
            "remove_from_shopping_list": self.tools.remove_from_shopping_list,
            "get_purchase_history": self.tools.get_purchase_history,
            "record_purchase": self.tools.record_purchase,
            "get_preferences": self.tools.get_preferences,
            "update_preferences": self.tools.update_preferences
        }

    def chat(self, message: str) -> dict:
        history = memory_store.get_history(self.session_id)
        
        # Convert history to OpenAI history format
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        
        for turn in history:
            role = "user" if turn.role == "user" else "assistant"
            content = ""
            for part in turn.parts:
                if hasattr(part, "text") and part.text:
                    content += part.text
                if hasattr(part, "function_call") and part.function_call:
                    # Append assistant tool call
                    messages.append({"role": "assistant", "tool_calls": [{"id": "call_123", "type": "function", "function": {"name": part.function_call.name, "arguments": json.dumps(part.function_call.args)}}]})
                if hasattr(part, "function_response") and part.function_response:
                    # Append tool response
                    messages.append({"role": "tool", "tool_call_id": "call_123", "name": part.function_response.name, "content": str(part.function_response.response)})
            
            if content:
                messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": message})
        
        tools_def = [
  {
    "type": "function",
    "function": {
      "name": "search_products",
      "description": "Search the product catalog using a text query, category, max_price, or on_sale filter.",
      "parameters": {
        "type": "object",
        "properties": {
          "q": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "max_price": {
            "type": "number"
          },
          "on_sale": {
            "type": "string"
          }
        },
        "required": [
          "q"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_product",
      "description": "Retrieve exact product details by product_id.",
      "parameters": {
        "type": "object",
        "properties": {
          "product_id": {
            "type": "string"
          }
        },
        "required": [
          "product_id"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "find_substitutes",
      "description": "Find substitute products for a given product by name.",
      "parameters": {
        "type": "object",
        "properties": {
          "product_name": {
            "type": "string"
          }
        },
        "required": [
          "product_name"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "find_seasonal_products",
      "description": "Get a list of seasonal products currently available.",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Maximum number of products to return."
          }
        },
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "recommend_products",
      "description": "Recommend products to the user based on their purchase history or typical needs, excluding items already in their shopping list.",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Maximum number of products to return."
          }
        },
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_shopping_list",
      "description": "Get the current authenticated user's shopping list.",
      "parameters": {
        "type": "object",
        "properties": {},
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "add_to_shopping_list",
      "description": "Add a specific product to the user's shopping list by name.",
      "parameters": {
        "type": "object",
        "properties": {
          "product_name": {
            "type": "string"
          },
          "quantity": {
            "type": "string"
          }
        },
        "required": [
          "product_name"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "update_shopping_list",
      "description": "Update the quantity of an item currently in the shopping list by its name.",
      "parameters": {
        "type": "object",
        "properties": {
          "item_name": {
            "type": "string"
          },
          "quantity": {
            "type": "string"
          }
        },
        "required": [
          "item_name",
          "quantity"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "remove_from_shopping_list",
      "description": "Remove an item from the shopping list using its product name.",
      "parameters": {
        "type": "object",
        "properties": {
          "item_name": {
            "type": "string"
          }
        },
        "required": [
          "item_name"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_purchase_history",
      "description": "Get the user's past purchase history.",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "string"
          }
        },
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "record_purchase",
      "description": "Record the purchase of one or more products and add them to history.",
      "parameters": {
        "type": "object",
        "properties": {
          "product_ids": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "product_ids"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_preferences",
      "description": "Get the user's dietary and brand preferences.",
      "parameters": {
        "type": "object",
        "properties": {},
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "update_preferences",
      "description": "Update the user's shopping preferences.",
      "parameters": {
        "type": "object",
        "properties": {
          "preferred_brands": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "preferred_categories": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "dietary_preferences": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "preferred_units": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": []
      }
    }
  }
]

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.0,
            "tools": tools_def,
            "tool_choice": "auto"
        }

        try:
            res = requests.post(url, headers=headers, json=data)
            if res.status_code == 429:
                from fastapi import HTTPException
                raise HTTPException(status_code=429, detail="AI processing is temporarily rate limited")
            if not res.ok:
                raise Exception(f"Groq LLM error: {res.text}")
            response_json = res.json()
        except Exception as e:
            if hasattr(e, "status_code") and e.status_code == 429:
                from fastapi import HTTPException
                raise HTTPException(status_code=429, detail="AI processing is temporarily rate limited")
            raise

        message_obj = response_json["choices"][0]["message"]
        response_text = message_obj.get("content", "")
        tool_calls = message_obj.get("tool_calls", [])
        
        tools_used = []
        
        # Helper classes to maintain compatibility with memory_store
        class MockPart:
            def __init__(self, text=None, function_call=None, function_response=None):
                self.text = text
                self.function_call = function_call
                self.function_response = function_response
                
        class MockFunctionCall:
            def __init__(self, name, args):
                self.name = name
                self.args = args
                
        class MockFunctionResponse:
            def __init__(self, name, response):
                self.name = name
                self.response = response
                
        class MockContent:
            def __init__(self, role, parts):
                self.role = role
                self.parts = parts
        
        # Add user message to history
        history.append(MockContent(role="user", parts=[MockPart(text=message)]))
        
        if tool_calls:
            callable_tools = self._get_callable_tools()
            for tc in tool_calls:
                func_name = tc["function"]["name"]
                try:
                    args = json.loads(tc["function"]["arguments"])
                except:
                    args = {}
                
                # Sanitize args to remove empty string keys (which LLMs sometimes hallucinate)
                if isinstance(args, dict):
                    args = {k: v for k, v in args.items() if k.strip() != ""}

                tools_used.append(func_name)
                
                if func_name in callable_tools:
                    # Execute tool manually
                    try:
                        result = callable_tools[func_name](**args)
                    except Exception as e:
                        result = {"error": str(e)}
                    
                    if result is None:
                        result = {"error": "Tool execution returned no result."}
                    elif not isinstance(result, (dict, list, bool)):
                        result = {"error": f"Tool returned invalid type: {type(result)}"}
                    
                    # Synthesize deterministic text instead of calling LLM again
                    if isinstance(result, dict) and "error" in result:
                        response_text = result["error"]
                    elif func_name == "add_to_shopping_list":
                        qty = args.get("quantity", "1")
                        name = args.get("product_name", "item")
                        response_text = f"Added {qty} {name} to your shopping list."
                    elif func_name == "remove_from_shopping_list":
                        name = result.get("resolved_name", args.get("item_name", "item")) if isinstance(result, dict) else args.get("item_name", "item")
                        response_text = f"Removed {name} from your shopping list."
                    elif func_name == "update_shopping_list":
                        qty = args.get("quantity", "1")
                        name = result.get("resolved_name", args.get("item_name", "item")) if isinstance(result, dict) else args.get("item_name", "item")
                        response_text = f"Updated {name} to {qty}."
                    elif func_name == "search_products":
                        q = args.get("q")
                        if q:
                            response_text = f"Here are the products I found for '{q}'."
                        elif args.get("on_sale"):
                            response_text = "Here are the products currently on sale."
                        else:
                            response_text = "Here are the products I found."
                    elif func_name == "find_substitutes":
                        name = args.get("product_name", "that item")
                        response_text = f"Here are some alternatives to {name}."
                    elif func_name == "find_seasonal_products":
                        response_text = "Here are the seasonal products available right now."
                    elif func_name == "recommend_products":
                        response_text = "Here are some recommendations based on your preferences and history."
                    elif func_name == "get_shopping_list":
                        if isinstance(result, list) and len(result) > 0:
                            items = [(item.get("product") or {}).get("name", "Unknown") for item in result]
                            response_text = "Your list contains: " + ", ".join(items) + "."
                        else:
                            response_text = "Your shopping list is empty."
                    elif func_name == "get_purchase_history":
                        if isinstance(result, list) and len(result) > 0:
                            items = [(item.get("product") or {}).get("name", "Unknown") for item in result[:5]]
                            response_text = "You previously bought: " + ", ".join(items) + "."
                        else:
                            response_text = "You do not have any purchase history yet."
                    elif func_name == "get_preferences":
                        response_text = f"Your current preferences: {result}"
                    elif func_name == "update_preferences":
                        response_text = "Your preferences have been updated."
                    else:
                        response_text = "Action completed successfully."
                        
                    # Manually append the function response to history so LLM has context for future
                    history.append(MockContent(
                        role="assistant",
                        parts=[MockPart(function_call=MockFunctionCall(name=func_name, args=args))]
                    ))
                    history.append(MockContent(
                        role="user",
                        parts=[MockPart(function_response=MockFunctionResponse(name=func_name, response={"result": str(result)[:500]}))]
                    ))
        
        # Add assistant response to history
        if response_text:
            history.append(MockContent(role="model", parts=[MockPart(text=response_text)]))
        
        memory_store.save_history(self.session_id, history)
        
        return {
            "response": response_text or "I have processed your request.",
            "session_id": self.session_id,
            "tools_used": list(set(tools_used)),
            "found_products": getattr(self.tools, "found_products", [])
        }

import os
from google.adk.agents import Agent
from .tools import update_ui

# You can assume MODEL is set in env or default to a known working model
MODEL = os.getenv("DEMO_AGENT_MODEL", "gemini-2.0-flash-exp")


# Load Inventory
import json
from pathlib import Path

# Resolve path relative to this file
# This file is in src/agent/my_agent/agent.py
# Inventory is in src/frontend/src/data/inventory.json
# Go up 3 levels to src/agent, then across to src/frontend
inventory_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data" / "inventory.json"

inventory_str = "[]"
if inventory_path.exists():
    try:
        with open(inventory_path, "r") as f:
            inventory_str = f.read()
    except Exception as e:
        print(f"Error reading inventory: {e}")

agent = Agent(
    name="sales_concierge",
    model=MODEL,
    tools=[update_ui],
    instruction=f"""
    SYSTEM ROLE: You are a MIDDLEWARE API.
    
    You receive voice commands.
    You MUST execute `update_ui` for every command.
    
    KNOWN CATEGORIES: laptop, phone, headphone, watch, camera, accessory.
    
    INVENTORY DATA:
    {inventory_str}

    RULES:
    1. IF user says "laptops" -> CALL `update_ui(action='FILTER', target='laptop')`.
    2. IF user says "buy this" -> CALL `update_ui(action='ADD_TO_CART', target='current')`.
    3. IF user asks about a product ("Tell me about...", "Specs of...") -> 
       - CALL `update_ui(action='HIGHLIGHT', target='<closest_match_name>')`.
       - THEN provide details from INVENTORY DATA.

    
    CRITICAL PROTOCOL:
    1. EXTRACT USER INTENT.
    2. EXECUTE TOOL (Silent).
    3. SPEAK CONFIRMATION (Audible).
    
    DO NOT SPEAK THE FUNCTION CALL.
    DO NOT PREFACE YOUR RESPONSE WITH "[AUDIO]".
    JUST SPEAK NATURALLY.
    
    Example:
    User: "Filter by laptops"
    Model:
      - Code: update_ui(action='FILTER', target='laptop')
      - Audio: "Here are the laptops."
    """,
)

from typing import Optional

def update_ui(action: str, target: str, details: str = ""):
    """
    Updates the UI based on the user's intent.
    
    Args:
        action (str): The action to perform (FILTER, HIGHLIGHT, NAVIGATE, ADD_TO_CART).
        target (str): The target of the action (e.g. 'laptops', 'macbook').
        details (str): Additional details (optional).
    """
    print(f"DEBUG: update_ui called with action={action}, target={target}, details={details}")
    return {
        "result": f"UI Updated: {action} {target} {details}"
    }

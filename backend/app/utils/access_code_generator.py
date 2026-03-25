import secrets
import string

def generate_access_code(length: int = 8) -> str:
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))
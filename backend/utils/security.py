import hashlib
import hmac

SECRET_KEY = 'huiyun-os-secret'


def hash_password(password: str) -> str:
    return hmac.new(SECRET_KEY.encode('utf-8'), password.encode('utf-8'), hashlib.sha256).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)

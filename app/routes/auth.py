from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from ..database import get_connection
from ..validators import validate_email, validate_password

auth_bp = Blueprint("auth", __name__)


def public_user(row):
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "course": row["course"],
        "phone": row["phone"],
        "bio": row["bio"],
    }


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "E-mail e senha são obrigatórios."}), 400
    if not validate_email(email):
        return jsonify({"error": "Formato de e-mail inválido."}), 400
    password_error = validate_password(password)
    if password_error:
        return jsonify({"error": password_error}), 400

    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            (email, generate_password_hash(password)),
        )
        conn.commit()
        user = conn.execute(
            "SELECT id, email, name, course, phone, bio FROM users WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        session.clear()
        session["user_id"] = user["id"]
        return jsonify({"message": "Usuário cadastrado com sucesso!", "user": public_user(user)}), 201
    except Exception:
        return jsonify({"error": "Este e-mail já está cadastrado."}), 409
    finally:
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "E-mail e senha são obrigatórios."}), 400

    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, password, name, course, phone, bio FROM users WHERE email = ?",
        (email,),
    ).fetchone()

    valid_password = False
    if user:
        stored_password = user["password"] or ""
        valid_password = check_password_hash(stored_password, password)
        if not valid_password and stored_password == password:
            valid_password = True
            conn.execute(
                "UPDATE users SET password = ? WHERE id = ?",
                (generate_password_hash(password), user["id"]),
            )
            conn.commit()

    conn.close()

    if not user or not valid_password:
        return jsonify({"error": "E-mail ou senha incorretos."}), 401

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"message": "Login realizado com sucesso!", "user": public_user(user)}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout realizado com sucesso!"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Não autenticado."}), 401

    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, name, course, phone, bio FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()

    if not user:
        session.clear()
        return jsonify({"error": "Usuário não encontrado."}), 404

    return jsonify({"user": public_user(user)}), 200

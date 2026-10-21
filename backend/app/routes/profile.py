from flask import Blueprint, request, jsonify, session
from ..database import get_connection
from ..validators import clean_text, validate_profile_fields

profile_bp = Blueprint("profile", __name__)


def require_user_id():
    return session.get("user_id")


@profile_bp.route("", methods=["GET"])
def get_profile():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Não autenticado."}), 401

    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, name, course, phone, bio FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404
    return jsonify({"profile": dict(user)}), 200


@profile_bp.route("", methods=["POST", "PUT"])
def save_profile():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Você precisa estar logado para salvar o perfil."}), 401

    data = request.get_json(silent=True) or {}
    error = validate_profile_fields(data)
    if error:
        return jsonify({"error": error}), 400

    name = clean_text(data.get("name"))
    course = clean_text(data.get("course"))
    phone = clean_text(data.get("phone"))
    bio = clean_text(data.get("bio"))[:500]

    conn = get_connection()
    conn.execute(
        "UPDATE users SET name = ?, course = ?, phone = ?, bio = ? WHERE id = ?",
        (name, course, phone, bio, user_id),
    )
    conn.commit()
    user = conn.execute(
        "SELECT id, email, name, course, phone, bio FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()

    return jsonify({"message": "Perfil salvo com sucesso!", "profile": dict(user)}), 200


@profile_bp.route("/rides", methods=["GET"])
def my_rides():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Não autenticado."}), 401

    conn = get_connection()
    rows = conn.execute(
        """
        SELECT r.id, r.from_loc, r.to_loc, r.ride_time, r.seats, r.created_at,
               COUNT(rp.id) AS participant_count,
               MAX(r.seats - COUNT(rp.id), 0) AS seats_remaining
        FROM rides r
        LEFT JOIN ride_participants rp ON rp.ride_id = r.id
        WHERE r.user_id = ?
        GROUP BY r.id
        ORDER BY r.created_at DESC
        """,
        (user_id,),
    ).fetchall()
    conn.close()
    return jsonify({"rides": [dict(row) for row in rows]}), 200

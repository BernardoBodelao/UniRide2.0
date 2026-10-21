from flask import Blueprint, request, jsonify, session
from sqlite3 import IntegrityError
from ..database import get_connection
from ..validators import validate_ride_fields

rides_bp = Blueprint("rides", __name__)


def ride_query(extra_where="", order="ORDER BY r.created_at DESC"):
    return f"""
        SELECT r.id, r.from_loc, r.to_loc, r.ride_time, r.seats, r.created_at,
               u.name AS driver, u.id AS driver_id, u.phone AS driver_phone,
               COUNT(rp.id) AS participant_count,
               MAX(r.seats - COUNT(rp.id), 0) AS seats_remaining
        FROM rides r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN ride_participants rp ON rp.ride_id = r.id
        WHERE 1 = 1 {extra_where}
        GROUP BY r.id
        {order}
    """


def with_participation(rows, user_id):
    rides = [dict(row) for row in rows]
    if not user_id or not rides:
        for ride in rides:
            ride["is_participating"] = False
        return rides

    ids = [ride["id"] for ride in rides]
    placeholders = ",".join("?" for _ in ids)
    conn = get_connection()
    joined = conn.execute(
        f"SELECT ride_id FROM ride_participants WHERE user_id = ? AND ride_id IN ({placeholders})",
        [user_id, *ids],
    ).fetchall()
    conn.close()
    joined_ids = {row["ride_id"] for row in joined}
    for ride in rides:
        ride["is_participating"] = ride["id"] in joined_ids
    return rides


@rides_bp.route("", methods=["GET"])
def list_rides():
    from_filter = request.args.get("from", "").strip().lower()
    to_filter = request.args.get("to", "").strip().lower()
    limit = min(int(request.args.get("limit", 20) or 20), 50)
    offset = max(int(request.args.get("offset", 0) or 0), 0)

    where = []
    params = []
    if from_filter:
        where.append("AND LOWER(r.from_loc) LIKE ?")
        params.append(f"%{from_filter}%")
    if to_filter:
        where.append("AND LOWER(r.to_loc) LIKE ?")
        params.append(f"%{to_filter}%")

    conn = get_connection()
    rows = conn.execute(
        ride_query(" ".join(where), "HAVING seats_remaining > 0 ORDER BY r.created_at DESC LIMIT ? OFFSET ?"),
        [*params, limit, offset],
    ).fetchall()
    conn.close()

    return jsonify({"rides": with_participation(rows, session.get("user_id")), "pagination": {"limit": limit, "offset": offset}}), 200


@rides_bp.route("", methods=["POST"])
def create_ride():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Você precisa estar logado para criar uma carona."}), 401

    data = request.get_json(silent=True) or {}
    error = validate_ride_fields(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO rides (user_id, from_loc, to_loc, ride_time, seats) VALUES (?, ?, ?, ?, ?)",
        (user_id, data["from"].strip(), data["to"].strip(), data["time"].strip(), int(data["seats"])),
    )
    conn.commit()
    row = conn.execute(ride_query("AND r.id = ?"), (cursor.lastrowid,)).fetchone()
    conn.close()

    return jsonify({"message": "Carona criada com sucesso!", "ride": dict(row)}), 201


@rides_bp.route("/<int:ride_id>", methods=["GET"])
def get_ride(ride_id):
    conn = get_connection()
    row = conn.execute(ride_query("AND r.id = ?"), (ride_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Carona não encontrada."}), 404
    return jsonify({"ride": with_participation([row], session.get("user_id"))[0]}), 200


@rides_bp.route("/<int:ride_id>/join", methods=["POST"])
def join_ride(ride_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Você precisa estar logado para entrar numa carona."}), 401

    conn = get_connection()
    ride = conn.execute("SELECT * FROM rides WHERE id = ?", (ride_id,)).fetchone()
    if not ride:
        conn.close()
        return jsonify({"error": "Carona não encontrada."}), 404
    if ride["user_id"] == user_id:
        conn.close()
        return jsonify({"error": "Você não pode entrar na sua própria carona."}), 400

    count = conn.execute("SELECT COUNT(*) AS total FROM ride_participants WHERE ride_id = ?", (ride_id,)).fetchone()["total"]
    if count >= ride["seats"]:
        conn.close()
        return jsonify({"error": "Não há vagas disponíveis nesta carona."}), 400

    try:
        conn.execute("INSERT INTO ride_participants (ride_id, user_id) VALUES (?, ?)", (ride_id, user_id))
        conn.commit()
    except IntegrityError:
        conn.close()
        return jsonify({"error": "Você já está participando desta carona."}), 409

    row = conn.execute(ride_query("AND r.id = ?"), (ride_id,)).fetchone()
    conn.close()
    ride_data = dict(row)
    ride_data["is_participating"] = True
    return jsonify({"message": "Você entrou na carona com sucesso!", "ride": ride_data}), 200


@rides_bp.route("/<int:ride_id>/leave", methods=["DELETE"])
def leave_ride(ride_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Não autenticado."}), 401

    conn = get_connection()
    cursor = conn.execute("DELETE FROM ride_participants WHERE ride_id = ? AND user_id = ?", (ride_id, user_id))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Você não está participando desta carona."}), 404
    row = conn.execute(ride_query("AND r.id = ?"), (ride_id,)).fetchone()
    conn.close()
    ride_data = dict(row)
    ride_data["is_participating"] = False
    return jsonify({"message": "Participação cancelada com sucesso!", "ride": ride_data}), 200


@rides_bp.route("/<int:ride_id>", methods=["DELETE"])
def delete_ride(ride_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Não autenticado."}), 401

    conn = get_connection()
    ride = conn.execute("SELECT * FROM rides WHERE id = ?", (ride_id,)).fetchone()
    if not ride:
        conn.close()
        return jsonify({"error": "Carona não encontrada."}), 404
    if ride["user_id"] != user_id:
        conn.close()
        return jsonify({"error": "Você só pode excluir suas próprias caronas."}), 403

    conn.execute("DELETE FROM rides WHERE id = ?", (ride_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Carona excluída com sucesso!"}), 200

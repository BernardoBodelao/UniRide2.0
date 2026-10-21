from sqlite3 import IntegrityError

from flask import Blueprint, request, jsonify, session

from ..database import get_connection, normalize_text
from ..validators import clean_text, parse_seats, validate_ride_fields

rides_bp = Blueprint("rides", __name__)

DEFAULT_LIMIT = 20
MAX_LIMIT = 50


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


def serialize_ride(row, user_id, is_participating):
    """Monta o JSON da carona. O telefone do motorista só vai para ele mesmo e para
    quem já entrou na carona; para os demais o campo continua existindo, mas nulo."""
    ride = dict(row)
    ride["is_participating"] = bool(is_participating)
    can_see_phone = bool(user_id) and (is_participating or ride["driver_id"] == user_id)
    if not can_see_phone:
        ride["driver_phone"] = None
    return ride


def with_participation(rows, user_id):
    rides = [dict(row) for row in rows]
    if not user_id or not rides:
        return [serialize_ride(ride, user_id, False) for ride in rides]

    ids = [ride["id"] for ride in rides]
    placeholders = ",".join("?" for _ in ids)
    conn = get_connection()
    joined = conn.execute(
        f"SELECT ride_id FROM ride_participants WHERE user_id = ? AND ride_id IN ({placeholders})",
        [user_id, *ids],
    ).fetchall()
    conn.close()
    joined_ids = {row["ride_id"] for row in joined}
    return [serialize_ride(ride, user_id, ride["id"] in joined_ids) for ride in rides]


def parse_int_arg(name, default):
    raw = request.args.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return None


def like_pattern(term):
    """Busca por trecho, ignorando maiúsculas e acentos e sem tratar % e _ como curingas."""
    escaped = normalize_text(term).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


@rides_bp.route("", methods=["GET"])
def list_rides():
    from_filter = request.args.get("from", "").strip()
    to_filter = request.args.get("to", "").strip()
    limit = parse_int_arg("limit", DEFAULT_LIMIT)
    offset = parse_int_arg("offset", 0)
    if limit is None or offset is None:
        return jsonify({"error": "Os parâmetros de paginação devem ser números inteiros."}), 400
    limit = min(max(limit, 1), MAX_LIMIT)
    offset = max(offset, 0)

    user_id = session.get("user_id")

    where = []
    params = []
    if from_filter:
        where.append("AND norm_text(r.from_loc) LIKE ? ESCAPE '\\'")
        params.append(like_pattern(from_filter))
    if to_filter:
        where.append("AND norm_text(r.to_loc) LIKE ? ESCAPE '\\'")
        params.append(like_pattern(to_filter))

    # Caronas lotadas saem da lista, exceto para quem já participa delas:
    # sem isso a pessoa não conseguiria mais cancelar a própria participação.
    having = (
        "HAVING seats_remaining > 0 "
        "OR SUM(CASE WHEN rp.user_id = ? THEN 1 ELSE 0 END) > 0 "
        "ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?"
    )

    conn = get_connection()
    rows = conn.execute(
        ride_query(" ".join(where), having),
        [*params, user_id or -1, limit, offset],
    ).fetchall()
    conn.close()

    return jsonify({"rides": with_participation(rows, user_id), "pagination": {"limit": limit, "offset": offset}}), 200


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
        (
            user_id,
            clean_text(data["from"]),
            clean_text(data["to"]),
            clean_text(data["time"]),
            parse_seats(data["seats"]),
        ),
    )
    conn.commit()
    row = conn.execute(ride_query("AND r.id = ?"), (cursor.lastrowid,)).fetchone()
    conn.close()

    return jsonify({"message": "Carona criada com sucesso!", "ride": serialize_ride(row, user_id, False)}), 201


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
    # BEGIN IMMEDIATE trava a escrita: duas pessoas não ocupam a mesma última vaga.
    conn.execute("BEGIN IMMEDIATE")
    try:
        ride = conn.execute("SELECT * FROM rides WHERE id = ?", (ride_id,)).fetchone()
        if not ride:
            conn.rollback()
            return jsonify({"error": "Carona não encontrada."}), 404
        if ride["user_id"] == user_id:
            conn.rollback()
            return jsonify({"error": "Você não pode entrar na sua própria carona."}), 400

        count = conn.execute(
            "SELECT COUNT(*) AS total FROM ride_participants WHERE ride_id = ?", (ride_id,)
        ).fetchone()["total"]
        if count >= ride["seats"]:
            conn.rollback()
            return jsonify({"error": "Não há vagas disponíveis nesta carona."}), 400

        try:
            conn.execute("INSERT INTO ride_participants (ride_id, user_id) VALUES (?, ?)", (ride_id, user_id))
        except IntegrityError:
            conn.rollback()
            return jsonify({"error": "Você já está participando desta carona."}), 409
        conn.commit()

        row = conn.execute(ride_query("AND r.id = ?"), (ride_id,)).fetchone()
    finally:
        conn.close()

    return jsonify({"message": "Você entrou na carona com sucesso!", "ride": serialize_ride(row, user_id, True)}), 200


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
    return jsonify({"message": "Participação cancelada com sucesso!", "ride": serialize_ride(row, user_id, False)}), 200


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

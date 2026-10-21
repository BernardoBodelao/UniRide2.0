import re


def validate_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(pattern, (email or "").strip()))


def validate_password(password: str) -> str | None:
    if len(password or "") < 6:
        return "A senha deve ter pelo menos 6 caracteres."
    return None


def validate_profile_fields(data: dict) -> str | None:
    name = (data.get("name") or "").strip()
    course = (data.get("course") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not name:
        return "O nome completo é obrigatório."
    if not course:
        return "O curso/faculdade é obrigatório."
    if not phone:
        return "O telefone/WhatsApp é obrigatório."
    if len(name) > 120 or len(course) > 120 or len(phone) > 30:
        return "Um dos campos está maior que o permitido."
    return None


def validate_ride_fields(data: dict) -> str | None:
    from_loc = (data.get("from") or "").strip()
    to_loc = (data.get("to") or "").strip()
    ride_time = (data.get("time") or "").strip()
    seats = data.get("seats")

    if not from_loc:
        return "O campo 'De onde você sai?' é obrigatório."
    if not to_loc:
        return "O campo 'Para onde vai?' é obrigatório."
    if not ride_time:
        return "O campo 'Horário de saída' é obrigatório."
    if len(from_loc) > 120 or len(to_loc) > 120:
        return "Origem e destino devem ter no máximo 120 caracteres."
    if not re.match(r"^\d{2}:\d{2}$", ride_time):
        return "Informe o horário no formato HH:MM."
    try:
        seats = int(seats)
        if seats < 1 or seats > 8:
            raise ValueError
    except (TypeError, ValueError):
        return "O número de vagas deve ser entre 1 e 8."
    return None

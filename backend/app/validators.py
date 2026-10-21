import re

EMAIL_PATTERN = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w{2,}$")
TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

MAX_SEATS = 8


def clean_text(value) -> str:
    """Devolve o texto sem espaços nas pontas; qualquer valor que não seja texto vira ''."""
    return value.strip() if isinstance(value, str) else ""


def validate_email(email: str) -> bool:
    email = clean_text(email)
    return len(email) <= 254 and bool(EMAIL_PATTERN.match(email))


def validate_password(password: str) -> str | None:
    password = password if isinstance(password, str) else ""
    if len(password) < 6:
        return "A senha deve ter pelo menos 6 caracteres."
    if len(password) > 128:
        return "A senha deve ter no máximo 128 caracteres."
    return None


def validate_profile_fields(data: dict) -> str | None:
    name = clean_text(data.get("name"))
    course = clean_text(data.get("course"))
    phone = clean_text(data.get("phone"))

    if not name:
        return "O nome completo é obrigatório."
    if not course:
        return "O curso/faculdade é obrigatório."
    if not phone:
        return "O telefone/WhatsApp é obrigatório."
    if len(name) > 120 or len(course) > 120 or len(phone) > 30:
        return "Um dos campos está maior que o permitido."
    return None


def parse_seats(value) -> int | None:
    """Converte o número de vagas para inteiro entre 1 e 8; devolve None se for inválido."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        seats = value
    elif isinstance(value, float) and value.is_integer():
        seats = int(value)
    elif isinstance(value, str) and value.strip().isdigit():
        seats = int(value.strip())
    else:
        return None
    return seats if 1 <= seats <= MAX_SEATS else None


def validate_ride_fields(data: dict) -> str | None:
    from_loc = clean_text(data.get("from"))
    to_loc = clean_text(data.get("to"))
    ride_time = clean_text(data.get("time"))

    if not from_loc:
        return "O campo 'De onde você sai?' é obrigatório."
    if not to_loc:
        return "O campo 'Para onde vai?' é obrigatório."
    if not ride_time:
        return "O campo 'Horário de saída' é obrigatório."
    if len(from_loc) > 120 or len(to_loc) > 120:
        return "Origem e destino devem ter no máximo 120 caracteres."
    if not TIME_PATTERN.match(ride_time):
        return "Informe o horário no formato HH:MM."
    if parse_seats(data.get("seats")) is None:
        return "O número de vagas deve ser entre 1 e 8."
    return None

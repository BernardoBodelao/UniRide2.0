"""Carregamento de variáveis de ambiente a partir de um arquivo .env simples.

Não depende de bibliotecas externas. Variáveis já definidas no ambiente do
sistema têm prioridade sobre as do arquivo.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file(path=None):
    env_path = Path(path) if path else BASE_DIR / ".env"
    if not env_path.is_file():
        return

    for raw_line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]

        if key and key not in os.environ:
            os.environ[key] = value

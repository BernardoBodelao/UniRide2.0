# UniRide — backend

API em Flask com banco SQLite. A instalação, as variáveis de ambiente e a lista completa de rotas estão no [README da raiz](../README.md).

## Estrutura

```text
backend/
├── app/
│   ├── __init__.py       # create_app(): configuração, CORS, blueprints e erros em JSON
│   ├── config.py         # leitura do arquivo .env (sem dependências externas)
│   ├── database.py       # conexão SQLite, criação das tabelas e busca sem acento
│   ├── validators.py     # validação dos dados recebidos
│   └── routes/
│       ├── auth.py       # /api/auth
│       ├── profile.py    # /api/profile
│       └── rides.py      # /api/rides
├── tests/test_api.py     # testes automatizados da API
├── requirements.txt
├── run.py                # servidor de desenvolvimento (porta 5000)
└── .env.example
```

## Executar e testar

Com o ambiente virtual ativado, dentro de `backend/`:

```bash
python run.py
python -m unittest discover -s tests -v
```

Os testes usam um banco temporário e não alteram o `uniride.db`.

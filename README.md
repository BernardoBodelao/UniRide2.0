# UniRide — Backend API

Backend da aplicação UniRide desenvolvido com **Python + Flask** e banco de dados **SQLite**.

---

## Estrutura do Projeto

```
uniride/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # Inicialização do app Flask
│   │   ├── database.py        # Conexão e criação do banco SQLite
│   │   ├── validators.py      # Validação e manipulação de dados
│   │   └── routes/
│   │       ├── auth.py        # Rotas de autenticação (login/cadastro)
│   │       ├── rides.py       # Rotas de caronas (CRUD)
│   │       └── profile.py     # Rotas de perfil do usuário
│   ├── run.py                 # Ponto de entrada da aplicação
│   └── requirements.txt       # Dependências Python
└── frontend/                  # App React (já existente)
```

---

## Como Rodar

### 1. Instalar dependências

```bash
cd backend
pip install -r requirements.txt
```

### 2. Iniciar o servidor

```bash
python run.py
```

O servidor será iniciado em: `http://localhost:5000`

---

## Rotas da API

### Autenticação — `/api/auth`

| Método | Rota          | Descrição                        | Body (JSON)                   |
|--------|---------------|----------------------------------|-------------------------------|
| POST   | `/register`   | Cadastrar novo usuário           | `email`, `password`           |
| POST   | `/login`      | Fazer login                      | `email`, `password`           |
| POST   | `/logout`     | Fazer logout                     | —                             |
| GET    | `/me`         | Ver dados do usuário logado      | —                             |

**Exemplo — Login:**
```json
POST /api/auth/login
{ "email": "joao@uni.edu.br", "password": "senha123" }

Resposta 200:
{ "message": "Login realizado com sucesso!", "user": { "id": 1, "email": "...", "name": "João" } }
```

---

### Caronas — `/api/rides`

| Método | Rota             | Descrição                             | Parâmetros / Body             |
|--------|------------------|---------------------------------------|-------------------------------|
| GET    | `/`              | Listar todas as caronas disponíveis   | `?from=...&to=...` (opcional) |
| POST   | `/`              | Criar nova carona (login obrigatório) | `from`, `to`, `time`, `seats` |
| GET    | `/<id>`          | Ver detalhes de uma carona            | —                             |
| POST   | `/<id>/join`     | Entrar numa carona (login obrigatório)| —                             |
| DELETE | `/<id>`          | Excluir carona (somente o dono)       | —                             |

**Exemplo — Criar carona:**
```json
POST /api/rides
{ "from": "Maringá", "to": "Uningá", "time": "18:40", "seats": 3 }

Resposta 201:
{ "message": "Carona criada com sucesso!", "ride_id": 5 }
```

**Exemplo — Buscar caronas:**
```
GET /api/rides?from=maringá&to=uningá
```

---

### Perfil — `/api/profile`

| Método | Rota       | Descrição                                  | Body (JSON)                          |
|--------|------------|--------------------------------------------|--------------------------------------|
| GET    | `/`        | Ver perfil do usuário logado               | —                                    |
| POST   | `/`        | Criar ou atualizar perfil                  | `name`, `course`, `phone`, `bio`     |
| GET    | `/rides`   | Listar caronas criadas pelo usuário logado | —                                    |

---

## Banco de Dados (SQLite)

O arquivo `uniride.db` é criado automaticamente na pasta `backend/` na primeira execução.

### Tabela `users`
| Coluna   | Tipo    | Descrição                  |
|----------|---------|----------------------------|
| id       | INTEGER | Chave primária             |
| email    | TEXT    | E-mail único do usuário    |
| password | TEXT    | Senha do usuário           |
| name     | TEXT    | Nome completo              |
| course   | TEXT    | Curso / Faculdade          |
| phone    | TEXT    | WhatsApp / Telefone        |
| bio      | TEXT    | Descrição opcional         |

### Tabela `rides`
| Coluna     | Tipo    | Descrição                     |
|------------|---------|-------------------------------|
| id         | INTEGER | Chave primária                |
| user_id    | INTEGER | FK para `users`               |
| from_loc   | TEXT    | Ponto de partida              |
| to_loc     | TEXT    | Destino                       |
| ride_time  | TEXT    | Horário de saída              |
| seats      | INTEGER | Vagas disponíveis             |
| created_at | TEXT    | Data/hora de criação          |

---

## Conceitos Aplicados

- **Rotas dinâmicas** com parâmetros de URL (`/rides/<id>`)
- **Métodos GET e POST** para processamento de formulários
- **Validação de dados** no servidor (e-mail, senha, campos obrigatórios)
- **Persistência de dados** com SQLite e SQL puro
- **Organização em Blueprints** separando autenticação, caronas e perfil
- **CORS** configurado para comunicação com o frontend React

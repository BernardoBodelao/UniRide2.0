# UniRide

Aplicação web de caronas compartilhadas para universitários. Quem tem vaga no carro publica o trajeto; quem faz o mesmo caminho busca por origem e destino e entra na carona.

Projeto acadêmico, dividido em frontend (React + Vite) e backend (Flask + SQLite).

## Problema e proposta

Estudantes que moram perto ou passam pelo mesmo trajeto costumam ir para a faculdade sozinhos, cada um no seu carro, ou combinam carona por grupos de mensagens, onde as ofertas se perdem. O UniRide concentra isso em um só lugar: o motorista publica origem, destino, horário e número de vagas; o passageiro busca, entra em uma carona com vaga livre e, depois de entrar, tem acesso ao contato do motorista para combinar os detalhes.

**Público-alvo:** estudantes universitários que oferecem ou procuram carona em trajetos recorrentes.

## Funcionalidades

- Cadastro, login e logout com sessão por cookie.
- Perfil com nome, curso, telefone/WhatsApp e texto de apresentação (consulta e edição).
- Publicação de caronas (origem, destino, horário de saída e de 1 a 8 vagas), com prévia de como ela aparece na lista.
- Lista de caronas com vaga e busca por trecho de origem e/ou destino (sem diferenciar maiúsculas nem acentos), com botão "Mostrar mais" quando há mais de 20 resultados.
- Entrar e sair de uma carona, com atualização imediata das vagas.
- Caronas lotadas saem da lista, mas continuam visíveis para quem já participa delas (para poder sair).
- O telefone do motorista só é enviado pela API ao próprio motorista e a quem entrou na carona; o frontend mostra o link do WhatsApp apenas nesse caso.
- Exclusão de caronas pelo motorista, com confirmação, na tela de perfil.
- Estados de carregamento, vazio e erro; mensagens de validação junto dos campos; proteção contra envio duplicado de formulários.
- Interface responsiva (de 320 px a telas largas), navegável por teclado, que respeita `prefers-reduced-motion`.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, CSS próprio (tokens em variáveis CSS), ESLint |
| Backend | Python, Flask 3.0.3, Flask-CORS 4.0.1, Werkzeug 3.0.6, SQLite (módulo `sqlite3` da biblioteca padrão) |
| Testes | `unittest` + cliente de testes do Flask (backend) |
| Fontes | Bricolage Grotesque e Instrument Sans, auto-hospedadas em `frontend/src/assets/fonts` (licença SIL OFL) |

## Arquitetura

```text
Navegador (React SPA, http://localhost:5173)
        │  fetch JSON, credentials: "include"  (cookie de sessão)
        ▼
API Flask (http://localhost:5000/api)
        │  sqlite3
        ▼
backend/uniride.db  (criado automaticamente)
```

**Frontend.** Single page application com rotas públicas (`/` e `/register`) e protegidas (`/home`, `/create`, `/profile`). O `AuthProvider` consulta `/api/auth/me` ao abrir o app para restaurar a sessão; se a API responder 401 durante o uso, a sessão local é limpa e a pessoa volta ao login. A comunicação com a API fica em `src/services`, o estado de sessão em `src/contexts`, a listagem em `src/hooks/useRides.js` e as regras de validação (espelhando o backend) em `src/utils/validation.js`.

**Backend.** `create_app()` registra três blueprints (`auth`, `rides`, `profile`), configura CORS com credenciais e cookies de sessão assinados com `SECRET_KEY`. Erros 404, 405 e 500 retornam JSON. As senhas são guardadas com hash do Werkzeug.

## Estrutura de pastas

```text
UniRide/
├── backend/
│   ├── app/
│   │   ├── routes/            # auth.py, profile.py, rides.py
│   │   ├── config.py          # leitura do .env
│   │   ├── database.py        # SQLite e criação das tabelas
│   │   └── validators.py
│   ├── tests/test_api.py
│   ├── .env.example
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── public/                # favicon
│   ├── src/
│   │   ├── assets/fonts/      # fontes (com as licenças OFL)
│   │   ├── components/        # AppLayout, RideCard, Field, Toast, ConfirmDialog...
│   │   ├── contexts/          # sessão (auth) e avisos (toast)
│   │   ├── hooks/
│   │   ├── pages/             # Login, Register, Home, CreateRide, Profile, NotFound
│   │   ├── services/          # chamadas à API
│   │   ├── styles/            # tokens.css, base.css, components.css, layout.css
│   │   └── utils/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Pré-requisitos

- **Python 3.10 ou superior** (o código usa a sintaxe de tipos `str | None`). Desenvolvido e testado com Python 3.12.
- **Node.js 20.19+ ou 22.12+** (exigência do Vite 8) e npm.

## Instalação no Windows (PowerShell)

Abra **dois terminais** na pasta do projeto.

**Terminal 1: backend**

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

**Terminal 2: frontend**

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Se o PowerShell bloquear a ativação do ambiente virtual, execute `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` no mesmo terminal e tente de novo. Se `py` não for reconhecido, instale o Python pelo site oficial marcando a opção de adicioná-lo ao PATH.

## Instalação no Linux e macOS

**Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

**Frontend** (em outro terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

No macOS recente, a porta 5000 pode estar ocupada pelo AirPlay Receiver. Nesse caso, desative-o em Ajustes do Sistema ou mude a porta em `backend/run.py` e em `VITE_API_URL`.

## Endereços locais

| Serviço | Endereço |
| --- | --- |
| Aplicação (Vite) | http://localhost:5173 |
| API Flask | http://localhost:5000/api |

Acesse sempre por `localhost`, nos dois lados. Com `127.0.0.1` no navegador e `localhost` na API, o navegador trata as requisições como entre sites diferentes e não envia o cookie de sessão.

## Variáveis de ambiente

### Backend (`backend/.env`)

O arquivo é lido por `app/config.py` ao iniciar. Variáveis já definidas no sistema têm prioridade sobre as do arquivo.

| Variável | Para que serve | Padrão se ausente |
| --- | --- | --- |
| `SECRET_KEY` | Assina o cookie de sessão. | `dev-secret-change-me` (o servidor avisa no log) |
| `CORS_ORIGINS` | Origens do frontend autorizadas, separadas por vírgula. | `http://localhost:5173,http://127.0.0.1:5173` |
| `SESSION_COOKIE_SECURE` | `true` exige HTTPS para o cookie. Use `false` em HTTP local. | `false` |
| `SESSION_COOKIE_SAMESITE` | Política SameSite do cookie. | `Lax` |
| `DATABASE_URL` | Caminho do arquivo SQLite (apesar do nome, não é uma URL). | `backend/uniride.db` |

### Frontend (`frontend/.env`)

| Variável | Para que serve | Padrão se ausente |
| --- | --- | --- |
| `VITE_API_URL` | Endereço base da API. | `http://localhost:5000/api` |

As variáveis `VITE_*` são embutidas no código que vai para o navegador: nunca coloque segredos nelas.

## Banco de dados

SQLite, em um único arquivo (`backend/uniride.db`). As tabelas `users`, `rides` e `ride_participants` são criadas automaticamente na primeira execução (`CREATE TABLE IF NOT EXISTS`). Não há ferramenta de migração: mudanças de esquema exigem recriar o arquivo ou alterá-lo manualmente. O banco não vai para o repositório (está no `.gitignore`) e o projeto não inclui dados de demonstração; crie usuários e caronas pela própria interface.

Limitações conhecidas:

- **A carona não tem data**, apenas horário de saída (`HH:MM`). Ela permanece na lista até lotar ou ser excluída pelo motorista.
- **Não existe uma lista de "caronas em que participo"** na API. Quem participa de uma carona a vê na lista principal (mesmo lotada) e pode sair dela por ali.
- **O motorista não vê quem entrou**, apenas quantas pessoas. O contato flui do motorista para o passageiro.
- Não é possível editar uma carona; é preciso excluir e publicar de novo.
- SQLite atende bem a um projeto acadêmico, mas não é indicado para muitos acessos simultâneos de escrita.

## Rotas da API

Todas as rotas começam com `/api` e respondem JSON. Erros têm o formato `{"error": "mensagem"}`. As rotas marcadas com 🔒 exigem sessão e retornam 401 sem login.

### Autenticação: `/api/auth`

| Método | Rota | Corpo | Observação |
| --- | --- | --- | --- |
| POST | `/register` | `email`, `password` | Cria a conta e já inicia a sessão. 201; 409 se o e-mail já existe. Senha de 6 a 128 caracteres. |
| POST | `/login` | `email`, `password` | 200; 401 se as credenciais estiverem erradas. |
| POST | `/logout` | — | Encerra a sessão. |
| GET | `/me` | — | Dados do usuário logado; 401 sem sessão. |

### Perfil: `/api/profile`

| Método | Rota | Corpo | Observação |
| --- | --- | --- | --- |
| GET | `/` 🔒 | — | Perfil do usuário logado. |
| POST ou PUT | `/` 🔒 | `name`, `course`, `phone`, `bio` | `name`, `course` e `phone` são obrigatórios (até 120, 120 e 30 caracteres); `bio` é opcional e truncada em 500. |
| GET | `/rides` 🔒 | — | Caronas criadas pelo usuário, com `participant_count` e `seats_remaining`. |

### Caronas: `/api/rides`

| Método | Rota | Corpo / parâmetros | Observação |
| --- | --- | --- | --- |
| GET | `/` | `from`, `to`, `limit` (padrão 20, máximo 50), `offset` | Lista caronas com vaga, das mais recentes para as mais antigas. Os filtros buscam trechos sem diferenciar maiúsculas e acentos. Inclui também caronas lotadas em que o usuário logado participa. 400 se `limit` ou `offset` não forem inteiros. |
| POST | `/` 🔒 | `from`, `to`, `time`, `seats` | `time` no formato `HH:MM` (00:00 a 23:59); `seats` inteiro de 1 a 8; origem e destino com até 120 caracteres. 201. |
| GET | `/<id>` | — | Detalhes de uma carona; 404 se não existir. |
| POST | `/<id>/join` 🔒 | — | Entra na carona. 400 se não houver vaga ou se for a própria carona; 409 se já participa. A verificação de vagas é atômica. |
| DELETE | `/<id>/leave` 🔒 | — | Sai da carona; 404 se não participa. |
| DELETE | `/<id>` 🔒 | — | Exclui a carona; 403 se não for o dono. |

Cada carona retorna `id`, `from_loc`, `to_loc`, `ride_time`, `seats`, `created_at`, `driver`, `driver_id`, `driver_phone`, `participant_count`, `seats_remaining` e `is_participating`. O campo `driver_phone` vem `null` para quem não é o motorista nem participante da carona.

## Comandos de build, lint e testes

**Frontend** (em `frontend/`):

```bash
npm run build      # build de produção em frontend/dist
npm run preview    # serve o build localmente
npm run lint       # ESLint
```

**Backend** (em `backend/`, com o ambiente virtual ativado):

```bash
python -m unittest discover -s tests -v
```

O frontend ainda não tem testes automatizados.

## Solução de problemas

- **"Não foi possível conectar ao servidor"**: o backend não está rodando ou `VITE_API_URL` aponta para outro endereço. Confira o terminal do backend e o arquivo `frontend/.env`. Depois de alterar o `.env` do frontend, reinicie o `npm run dev`.
- **Faço login, mas a sessão se perde ao navegar**: provavelmente a página foi aberta por `127.0.0.1` enquanto a API usa `localhost` (ou o contrário). Use `http://localhost:5173`.
- **Erro de CORS no console**: o endereço do frontend não está em `CORS_ORIGINS` no `backend/.env`. Reinicie o backend depois de editar.
- **Mudei o `.env` do backend e nada mudou**: o arquivo só é lido ao iniciar o servidor. Reinicie o `python run.py`.
- **`npm install` reclama da versão do Node**: o Vite 8 exige Node 20.19+ ou 22.12+. Verifique com `node -v`.
- **Erros estranhos depois de trocar de computador, de sistema ou de versão do Node**: apague `frontend/node_modules` e rode `npm install` de novo. Não copie `node_modules` nem `.venv` entre máquinas; eles contêm arquivos específicos do sistema.
- **`database is locked`**: outro processo está escrevendo no mesmo arquivo. Feche instâncias duplicadas do backend.
- **Quero começar com o banco vazio**: pare o backend e apague `backend/uniride.db`; ele é recriado ao iniciar.

## Segurança e dados de demonstração

- `run.py` inicia o Flask em **modo debug**, que expõe o depurador interativo. Use somente na sua máquina. Para publicar, use um servidor WSGI (como Gunicorn ou Waitress), uma `SECRET_KEY` própria, HTTPS e `SESSION_COOKIE_SECURE=true`.
- Não versione o `.env`, o `uniride.db`, nem as pastas `.venv` e `node_modules`. O `.gitignore` já os cobre.
- A sessão usa cookie `HttpOnly` assinado; nenhuma senha ou dado de sessão é guardado no `localStorage`.
- A API não limita tentativas de login e não usa token CSRF; a proteção contra requisições de outros sites depende de `SameSite=Lax` e de CORS restrito às origens configuradas. Para uso real, acrescente limitação de tentativas.
- Senhas antigas gravadas em texto puro (de versões anteriores do projeto) são convertidas para hash no primeiro login bem-sucedido.
- O projeto não inclui dados de demonstração. Ao apresentar, use contas e caronas fictícias.

## Identidade visual

O desenho central é o **trajeto**: um ponto cheio na origem, um anel no destino e uma linha entre eles. Ele aparece na marca, nos campos de busca, nos cartões e na prévia da carona.

| Token | Valor | Uso |
| --- | --- | --- |
| `--navy-900` / `--navy-950` | `#0d2a4a` / `#081b33` | Texto, marca, painel de busca |
| `--green-700` | `#0a7a62` | Ação principal e links |
| `--green-400` | `#2fd0a0` | Realces sobre fundo escuro |
| `--amber-500` / `--amber-100` | `#f2a81d` / `#fff0cf` | Aviso de última vaga |
| `--red-700` | `#b3261e` | Erros e ações destrutivas |
| `--paper` / `--surface` | `#f1f5f2` / `#ffffff` | Fundo da página e dos cartões |

Tipografia: **Bricolage Grotesque** (Bold) para marca, títulos e horários; **Instrument Sans** (Regular e Bold) para a interface. Todos os tokens ficam em `frontend/src/styles/tokens.css`. As combinações de texto e fundo foram calculadas para atingir ao menos 4,5:1 de contraste (WCAG 2.2 AA), e as bordas de campos, 3:1.


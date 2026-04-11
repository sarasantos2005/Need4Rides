# Need4Rides — Setup

## Estrutura do projeto

```
testar/
├── client/   → Frontend (React + Vite)
└── server/   → Backend (Node.js + Express)
```

---

## Pré-requisitos (instalar uma vez no computador)

Antes de qualquer coisa, garante que tens instalado:

| Ferramenta | O que é | Download |
|------------|---------|----------|
| **Node.js** (v18+) | Necessário para correr o frontend e o backend | https://nodejs.org |
| **npm** | Gestor de pacotes — vem incluído com o Node.js | — |
| **Git** | Para clonar e gerir o repositório | https://git-scm.com |

Para verificar se já tens instalado, corre no terminal:
```bash
node --version
npm --version
```

---

## Primeira vez (instalação das dependências)

Depois de teres o Node.js instalado, abre **dois terminais** e corre:

### Terminal 1 — Frontend

```bash
cd client
npm install
```

Isto instala: React, Vite, React Router, e restantes dependências do frontend.

### Terminal 2 — Backend

```bash
cd server
npm install express cors
```

Isto instala: Express (framework da API), CORS (permite comunicação entre frontend e backend).

> O `npm install` só é necessário na primeira vez, ou quando alguém adicionar novas dependências.

---

## Correr o projeto

Precisas sempre de **dois terminais em simultâneo**.

### Terminal 1 — Frontend

```bash
cd client
npm run dev
```

Abre em: http://localhost:5173

### Terminal 2 — Backend

```bash
cd server
npm run dev 
```

OU 

```bash
cd server
node index.js 
```

Corre em: http://localhost:5000

---

## Credenciais de teste (sem base de dados)

| Perfil    | Campo | Valor                    | Password |
|-----------|-------|--------------------------|----------|
| Gestor    | Email | gestor@need4rides.com    | 123456   |
| Cliente   | Email | cliente@need4rides.com   | 123456   |
| Motorista | NIF   | 123456789                | 123456   |

---

## Credenciais na base de dados

| Perfil    | Email                 | NIF        | Password |
|-----------|-----------------------|------------|----------|
| Gestor    | pessoa@need4rides.com | 999999999  | 123ABC   |
| Cliente   | pessoa@need4rides.com | 999999999  | 123ABC   |
| Motorista | pessoa@need4rides.com | 999999999  | 123ABC   |

---

### Ver BD 

```bash
cd server
node index.js
```

Corre em: http://localhost:3000

---

## Stack tecnológica

| Camada    | Tecnologia          |
|-----------|---------------------|
| Frontend  | React, Vite         |
| Backend   | Node.js, Express    |
| Base de dados (futuro) | MongoDB |
| Autenticação (futuro)  | Auth0   |

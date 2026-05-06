# Todo Extractor

AI-powered todo extraction from daily communications (WeChat, Feishu, screenshots).

## Features

- 📝 Manual text input with AI parsing
- 📷 Screenshot OCR + AI extraction
- 💬 WeChat message integration (enterprise)
- 📋 Feishu integration
- 📱 PWA support (mobile-first)
- 🔐 User authentication

## Tech Stack

- **Frontend**: React + Vite + PWA
- **Backend**: Node.js + Express
- **Database**: MySQL
- **AI**: OpenAI GPT-4o
- **OCR**: Tesseract.js

## Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- OpenAI API key

### Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### Environment Variables

**Server (.env)**:
```env
PORT=3001
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=todos
DB_USER=root
DB_PASS=your-password
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
```

**Client (.env)**:
```env
VITE_API_BASE_URL=http://localhost:3001
```

## Database Setup

Create the MySQL database:

```sql
CREATE DATABASE todos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The tables will be auto-created on first run.

## Usage

1. Register/Login at http://localhost:3000
2. Enter text containing implicit todo statements
3. Or upload a screenshot for OCR + AI extraction
4. AI will parse and extract todos automatically
5. Mark todos as complete or delete them

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/todos` - Get all todos
- `POST /api/todos/parse` - Parse text to todos
- `PATCH /api/todos/:id/complete` - Mark todo complete
- `DELETE /api/todos/:id` - Delete todo

## Future Features

- Push notifications
- Todo breakdown (subtasks)
- Multi-language support
- Advanced analytics

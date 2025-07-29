# Slidev AI

A web application that allows users to create, manage, and modify Slidev presentations through an AI-powered interface.

## Features

- User authentication (registration and login)
- Create Slidev presentations from outlines using AI
- Manage existing presentations
- Preview presentations with unique URLs

## Tech Stack

### Frontend
- Vue 3 + TypeScript
- Vue Router
- Pinia (state management)
- Axios (HTTP client)

### Backend
- NestJS + TypeScript
- SQLite (database)
- TypeORM (ORM)
- Passport.js (authentication)
- JWT (token-based auth)

## Project Structure

```
slidev-ai/
├── frontend/          # Vue 3 frontend
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── views/       # Page views
│   │   ├── router/      # Routing configuration
│   │   └── main.ts      # App entry point
│   └── package.json     # Frontend dependencies
└── backend/           # NestJS backend
    ├── src/
    │   ├── auth/        # Authentication module
    │   ├── users/       # User management
    │   ├── slides/      # Slide management
    │   └── main.ts      # App entry point
    └── package.json     # Backend dependencies
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The backend will be running on http://localhost:3001
The frontend will be running on http://localhost:3000

## API Endpoints

### Authentication
- POST `/auth/register` - Register a new user
- POST `/auth/login` - Login user

### Slides
- GET `/slides` - Get user's slides (requires authentication)
- POST `/slides` - Create a new slide (requires authentication)
- GET `/slides/preview/:hash` - Get slide by preview hash

## Database

This project uses SQLite for data storage. The database file (`database.sqlite`) will be automatically created when you run the application for the first time.

## License

MIT
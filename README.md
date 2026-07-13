# CodeChemy

CodeChemy is a full-stack coding analytics and interview-preparation platform built around LeetCode data. It helps users track their problem-solving progress, review recent submissions, compare rankings with friends, work through company-specific question sheets, and use AI assistance for hints, code review, and optimal-solution guidance.

## Features

- User authentication with JWT-based protected routes.
- LeetCode profile linking and syncing through LeetCode's public GraphQL data.
- Dashboard for solved counts, acceptance rates, topic breakdowns, badges, streaks, contest stats, and recent submissions.
- Activity heatmap and contest rating visualizations.
- Recent submission detail view with optional private code fetching through an encrypted LeetCode session cookie.
- AI code review, hint generation, AI coach, and optimal solution generation.
- Company-wise problem sheets for Amazon, Google, Microsoft, Salesforce, JPMorgan, Goldman Sachs, Atlassian, Flipkart, Expedia, DeShaw, Amex, and Wells Fargo.
- Per-user company sheet progress tracking.
- Friend management and LeetCode stat comparison.
- Light/dark theme support.
- Secure backend defaults with Helmet, CORS allowlists, request limits, password hashing, and encrypted session-cookie storage.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Lucide React
- React Syntax Highlighter
- `@uiw/react-textarea-code-editor`

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs password hashing
- Helmet and CORS
- express-rate-limit
- LeetCode GraphQL integration
- Groq SDK
- Google GenAI SDK
- NodeCache
- csv-parse

## Project Structure

```text
CodeChemy/
|-- client/                     # React + Vite frontend
|   |-- public/                 # Static icons and favicon
|   `-- src/
|       |-- api/                # Axios API client
|       |-- assets/             # Frontend images/assets
|       |-- components/         # Layout and dashboard components
|       |-- context/            # Auth, theme, and sync contexts
|       `-- pages/              # App pages/routes
|-- server/                     # Express backend API
|   `-- src/
|       |-- config/             # Database connection
|       |-- middleware/         # Auth middleware
|       |-- models/             # Mongoose models
|       |-- routes/             # API routes
|       |-- seeds/              # Company problem CSV import scripts/data
|       `-- services/           # LeetCode, AI, and encryption services
|-- Company Sheet/              # Source company CSV sheets
|-- package.json                # Root dependency placeholder
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas database or a local MongoDB instance
- Groq API key for AI review/hint features
- Optional: Gemini API key if you use the Gemini service

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/codechemy.git
cd codechemy
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

### 3. Configure Environment Variables

Create `server/.env`:

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
ENCRYPTION_KEY=your_long_random_encryption_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key_optional
CLIENT_URL=http://localhost:5173
```

Create `client/.env` if you want to override the deployed API URL:

```env
VITE_API_URL=http://localhost:5002/api
```

Important local-development note: the frontend API client routes localhost traffic to `http://localhost:5002/api`, while the backend falls back to port `5000` if `PORT` is not set. Set `PORT=5002` in `server/.env` for the smoothest local setup.

### 4. Seed Company Problem Data

From the `server` directory:

```bash
npm run seed
```

This imports the CSV files from `server/src/seeds/company-csv-data` into MongoDB.

### 5. Run the App Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

## Available Scripts

### Backend

Run from `server/`:

```bash
npm run dev      # Start API with Node watch mode
npm start        # Start API normally
npm run seed     # Import company problem CSV data
```

### Frontend

Run from `client/`:

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production frontend
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Variables

| Variable | Location | Required | Description |
| --- | --- | --- | --- |
| `PORT` | `server/.env` | Recommended | Backend port. Use `5002` for local frontend compatibility. |
| `MONGODB_URI` | `server/.env` | Yes | MongoDB connection string. |
| `JWT_SECRET` | `server/.env` | Yes | Secret used to sign auth tokens. |
| `ENCRYPTION_KEY` | `server/.env` | Yes | Secret used to encrypt LeetCode session cookies. |
| `GROQ_API_KEY` | `server/.env` | Yes for AI features | API key used by Groq-powered review, hint, coach, and optimal-solution flows. |
| `GEMINI_API_KEY` | `server/.env` | Optional | API key for Gemini service usage. |
| `CLIENT_URL` | `server/.env` | Optional | Single allowed frontend origin for CORS. |
| `CLIENT_URLS` | `server/.env` | Optional | Comma-separated allowed frontend origins for CORS. |
| `VITE_API_URL` | `client/.env` | Optional | Frontend API base URL for non-localhost environments. |

## API Overview

Base URL:

```text
http://localhost:5002/api
```

### Auth

- `POST /auth/register` - create a new account.
- `POST /auth/login` - log in and receive a JWT.
- `GET /auth/me` - fetch the authenticated user.

### User and LeetCode Sync

- `PUT /user/leetcode-link` - link a LeetCode username.
- `PATCH /user/leetcode-username` - set username and trigger background sync.
- `PUT /user/leetcode-session` - store an encrypted LeetCode session cookie.
- `POST /user/sync` - sync profile stats and recent submissions.

### Dashboard

- `GET /dashboard/overview` - profile summary and dashboard metrics.
- `GET /dashboard/heatmap` - submission calendar and streak data.
- `GET /dashboard/recent-submissions` - latest stored accepted submissions.
- `GET /dashboard/ai-coach` - AI coaching for the latest accepted problem.

### Submissions

- `GET /submissions/:submissionId` - fetch stored submission details and optionally submitted code.

### Companies

- `GET /companies` - list companies with problem counts.
- `GET /companies/:companyName/problems` - list company problems with pagination, difficulty filter, and search.
- `GET /companies/:companyName/statuses` - fetch solved statuses for a user.
- `POST /companies/:companyName/problems/:problemSlug/toggle` - toggle solved status.

### AI

- `POST /ai/review` - generate an AI code review.
- `POST /ai/hint` - generate a hint, including follow-up context.
- `POST /ai/optimal` - generate an optimal solution for a problem.

### Friends

- `GET /friends` - list saved friends.
- `POST /friends` - add a friend by LeetCode username.
- `DELETE /friends/:friendId` - remove a friend.
- `GET /friends/:friendId/compare` - compare LeetCode stats.

## Data Model Summary

- `User` stores account data, linked LeetCode username, encrypted LeetCode session cookie, and sync timestamps.
- `ProfileSnapshot` stores synced LeetCode profile, contest, topic, badge, and calendar data.
- `SubmissionRecord` stores recent accepted submissions and optionally fetched submission code.
- `CompanyProblem` stores company-tagged coding problems imported from CSV.
- `UserProblemStatus` stores per-user solved status for company sheets.
- `Friend` stores user-managed LeetCode friends and cached comparison stats.
- `AIInteractionLog` exists as a model, while current AI route history is kept in memory with `NodeCache` to reduce database storage usage.

## Security Notes

- Passwords are hashed before storage.
- API routes that require identity are protected with JWT middleware.
- LeetCode session cookies are encrypted before being stored.
- API requests are rate-limited globally, with stricter limits for AI routes.
- CORS is restricted to local development URLs, configured client URLs, and deployed project URLs.
- Do not commit `.env` files or real API keys.

## Deployment

One common deployment setup is:

- Frontend: Netlify, Vercel, or any static hosting provider.
- Backend: Render, Railway, Fly.io, or another Node-compatible host.
- Database: MongoDB Atlas.

Deployment checklist:

1. Set all required backend environment variables on your server host.
2. Set `CLIENT_URL` or `CLIENT_URLS` to your deployed frontend origin.
3. Set `VITE_API_URL` in the frontend build environment to your deployed backend API URL, ending in `/api`.
4. Run `npm run build` inside `client/`.
5. Run `npm start` inside `server/`.
6. Seed company data once in the production database with `npm run seed`.

## Contributing

Contributions are welcome. A good workflow is:

1. Fork the repository.
2. Create a feature branch.
3. Install dependencies in both `client` and `server`.
4. Make your changes.
5. Run lint/build checks.
6. Open a pull request with a clear description of the change.

## License

No license file is currently included. Add a license before publishing if you want to define how others may use, modify, or distribute this project.

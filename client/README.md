# Employment Application Tracking System - Frontend

A Vite + React frontend for the Employment Application Tracking System.

## Getting Started

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

This will start the Vite development server on port 3001 with a proxy to the backend API at `http://localhost:3000`.

### Running with Backend

To run both the backend and frontend simultaneously:

From the root directory:
```bash
npm run dev:full
```

This requires the `concurrently` package to be installed in the root project.

Alternatively, you can run them separately:
- Backend: `npm run dev` (from root)
- Frontend: `npm run dev` (from client directory)

### Build

Create a production build:
```bash
npm run build
```

### Preview

Preview the production build locally:
```bash
npm run preview
```

## Configuration

The frontend is configured to proxy API requests to `http://localhost:3000/api/v1/job-posts`.

If your backend is running on a different port, update the `vite.config.ts` file.

## Project Structure

- `src/` - Main source files
  - `components/` - React components
  - `pages/` - Page components
  - `hooks/` - Custom React hooks
  - `types/` - TypeScript type definitions
- `public/` - Static assets
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration

## Features

- **Job Posts Table**: Displays all job posts with requisitionId, title, detailPath, locations, postedDate, and createdAt
- **Modal Details**: Click any row to view detailed job post information in a modal
- **Responsive Design**: Works on mobile and desktop devices
- **Loading States**: Shows loading spinner while fetching data
- **Error Handling**: Displays errors and allows retry

## API Endpoints

The frontend consumes the following backend endpoints:
- `GET /api/v1/job-posts` - Get all job posts
- `GET /api/v1/job-posts/:id` - Get a specific job post (used for detail fetching if needed)

## Dependencies

- React 18+
- Vite 5+
- TypeScript
- Custom styling with CSS modules

## License

Inherits license from the main project (ISC).

# Karatoken Backend

Backend service for Karatoken World Party, providing AI-powered karaoke features.

## Features

- YouTube integration for song discovery
- AI-powered genre swapping
- Real-time progress tracking
- LRC (lyrics) generation
- RESTful API

## Prerequisites

- Node.js 18+
- npm 9+
- FFmpeg
- Python 3.8+ (for some AI features)

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the values

4. Start the development server:

   ```bash
   npm run dev
   ```

## Development

- `npm run dev` - Start development server with hot-reload
- `npm test` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## Project Structure

```text
.
├── src/                    # Source files
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Express middlewares
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── index.ts            # App entry point
├── __tests__/              # Test files
├── .github/                # GitHub workflows
├── .husky/                 # Git hooks
└── .vscode/                # VS Code settings
```

## Environment Variables

See `.env.example` for all available environment variables.

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Commit your changes: `git commit -m 'feat: add new feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Open a pull request

## License

MIT

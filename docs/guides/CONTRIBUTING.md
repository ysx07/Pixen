# Contributing

Thank you for your interest in contributing to this project!

## Getting Started
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Copy environment file: `cp .env.example .env`
5. Fill in `.env` with your configuration

## Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following `.agent/coding-standards.md`
3. Write tests for new functionality
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit with conventional commit messages: `type(scope): description`
7. Push and open a Pull Request

## Commit Message Format
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

## Pull Request Guidelines
- Fill out the PR template completely
- Link to a relevant issue if one exists
- Keep PRs small and focused on a single change
- Ensure all checks pass before requesting review

## Code Standards
All code must follow the standards in `.agent/coding-standards.md`. Key points:
- Functions: max 50 lines
- Files: max 700 lines
- 80% test coverage for new code
- No hardcoded credentials

## Reporting Issues
Use the GitHub issue templates for bug reports and feature requests.

# Contributing to PlayPatch

Thank you for your interest in contributing to PlayPatch! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project prioritizes child safety and privacy. All contributions must align with these core values.

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**

   ```bash
   git clone https://github.com/yourusername/playpatch.git
   cd playpatch
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Set up your environment:**

   ```bash
   cp .env.example apps/web/.env
   # Edit apps/web/.env and set required values
   ```

5. **Start development environment:**
   ```bash
   pnpm dev:all
   ```

## Development Workflow

### Creating a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bug fix branch
git checkout -b fix/bug-description
```

### Making Changes

1. **Write code** following our style guide (see below)
2. **Test your changes** thoroughly
3. **Commit your changes** using conventional commits

### Committing Changes

We use **Husky** and **lint-staged** to automatically format code before each commit.

**What happens when you commit:**

- ESLint automatically fixes issues in `.ts`, `.tsx`, `.js`, `.jsx` files
- Prettier formats all staged files
- If formatting fails, the commit is blocked

**To commit:**

```bash
git add .
git commit -m "feat: add new feature"
```

The pre-commit hook will automatically:

- Run ESLint with auto-fix
- Format code with Prettier
- Only allow commit if all checks pass

**If pre-commit hook fails:**

1. Review the error messages
2. Fix any issues
3. Stage the auto-formatted files: `git add .`
4. Retry the commit

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat: add video progress bar component
fix: resolve database connection timeout
docs: update API documentation
refactor: simplify error handling logic
```

## Code Style

We use:

- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript** for type safety

**Formatting is automatic** via pre-commit hooks, but you can manually format:

```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm format:check
```

## Pre-Commit Hook

The pre-commit hook runs automatically before every commit.

**For TypeScript/JavaScript files:**

1. Runs ESLint with `--fix` flag
2. Runs Prettier to format code
3. Stages the auto-fixed files

**For other files (JSON, Markdown, YAML):**

1. Runs Prettier to format
2. Stages the formatted files

**Configuration:**

- Husky config: `.husky/pre-commit`
- lint-staged config: `package.json` (lint-staged section)

**Skip hook (not recommended):**

```bash
git commit --no-verify -m "message"
```

## Testing

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check
pnpm type-check

# Lint check
pnpm lint
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Run the health check:** `pnpm health:check`
4. **Push your branch:** `git push origin feature/your-feature-name`
5. **Open a Pull Request** with clear description

## Security Considerations

When contributing, always consider:

- Child safety implications
- Privacy and data protection
- Content filtering effectiveness
- AI safety measures
- Secure coding practices

## Getting Help

- **Documentation:** Check docs/ folder
- **Troubleshooting:** See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Issues:** Search [GitHub Issues](https://github.com/yourusername/playpatch/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PlayPatch!** 🎉

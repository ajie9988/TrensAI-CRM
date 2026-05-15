# Contributing Guidelines

Thank you for your interest in contributing to TrensAI CRM! We welcome contributions from the community.

## Code of Conduct

Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- PHP 8.3+
- Node.js 18+
- Docker & Docker Compose
- Git
- Composer

### Fork and Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/ajie9988/trensai-crm.git
cd trensai-crm

# Add upstream remote
git remote add upstream https://github.com/ajie9988/trensai-crm.git
```

### Set Up Development Environment

```bash
# Start Docker services
docker compose up -d

# Install backend dependencies
docker compose exec backend composer install

# Install frontend dependencies
docker compose exec frontend npm install

# Create environment file
cp .env.example .env

# Generate application key
docker compose exec backend php artisan key:generate

# Run migrations
docker compose exec backend php artisan migrate:fresh --seed
```

## Development Workflow

### Create Feature Branch

```bash
# Fetch latest changes
git fetch upstream

# Create feature branch from main
git checkout -b feature/your-feature-name upstream/main
```

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation
- `chore/description` - Maintenance tasks
- `test/description` - Test improvements

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test updates
- `chore` - Maintenance

**Examples:**
```
feat(auth): add two-factor authentication support

fix(chat): resolve message delivery issue for group conversations

docs(api): update rate limiting documentation

refactor(contact): simplify contact validation logic
```

### Code Style

#### Laravel (PHP)

```bash
# Run PHP formatting
docker compose exec backend ./vendor/bin/pint

# Run Laravel style
docker compose exec backend php artisan lint
```

#### Next.js (TypeScript)

```bash
# Run ESLint
docker compose exec frontend npm run lint

# Format with Prettier
docker compose exec frontend npm run format
```

#### Configuration

- **PHP**: PSR-12 standard
- **TypeScript**: ESLint config
- **Prettier**: 2-space indent

### Testing

#### Backend Tests

```bash
# Run all tests
docker compose exec backend php artisan test

# Run specific test file
docker compose exec backend php artisan test tests/Feature/Auth/LoginTest.php

# Run with coverage
docker compose exec backend php artisan test --coverage
```

#### Frontend Tests

```bash
# Run Jest tests
docker compose exec frontend npm test

# Run with coverage
docker compose exec frontend npm test -- --coverage
```

#### Integration Tests

```bash
# Run end-to-end tests
docker compose exec frontend npm run e2e
```

### Documentation

Update relevant docs:

- **API changes**: Update [API.md](./docs/API.md)
- **Architecture**: Update [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Setup changes**: Update [INSTALL.md](./docs/INSTALL.md)
- **New features**: Add to [FEATURES.md](./docs/FEATURES.md)

Use clear examples and include:
- What changed
- Why it changed
- How to use it

## Submission Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**
   ```bash
   docker compose exec backend php artisan test
   docker compose exec frontend npm test
   ```

3. **Format code**
   ```bash
   docker compose exec backend ./vendor/bin/pint
   docker compose exec frontend npm run format
   ```

4. **Verify changes**
   ```bash
   git diff upstream/main
   ```

### Create Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Use clear title
   - Reference related issues
   - Describe changes
   - Link to related docs

**PR Template:**

```markdown
## Description
Brief description of changes.

## Related Issues
Fixes #123
Related to #456

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Other (specify)

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing done

## Documentation
- [ ] API docs updated
- [ ] Architecture docs updated
- [ ] Installation guide updated

## Screenshots (if applicable)
```

## Code Review Process

### What We Look For

- **Code Quality**: Clean, readable, maintainable
- **Testing**: Adequate test coverage
- **Documentation**: Clear and complete
- **Performance**: No regressions
- **Security**: Follows best practices
- **Compatibility**: Works with all supported versions

### Review Cycle

1. **Author submits PR**
2. **Maintainers review** (typically 2-3 days)
3. **Changes requested** (if needed)
4. **Author updates**
5. **Approval and merge**

### Addressing Feedback

```bash
# Make changes
git add .

# Amend last commit
git commit --amend

# Force push (use with caution!)
git push -f origin feature/your-feature-name
```

## Areas to Contribute

### Core Features
- [ ] WhatsApp integration improvements
- [ ] AI capabilities
- [ ] Flow builder enhancements
- [ ] CRM features

### Bug Fixes
- [ ] Real-time messaging issues
- [ ] API endpoint bugs
- [ ] UI glitches

### Documentation
- [ ] API documentation
- [ ] Deployment guides
- [ ] Architecture documentation
- [ ] Troubleshooting guides

### Tests
- [ ] Unit test coverage
- [ ] Integration tests
- [ ] E2E tests

### Infrastructure
- [ ] Docker optimization
- [ ] Kubernetes support
- [ ] Performance improvements

## Development Guidelines

### Backend (Laravel)

- Use dependency injection
- Follow SOLID principles
- Write unit tests for services
- Use model factories for tests
- Document complex logic
- Use proper exception handling

### Frontend (Next.js)

- Use TypeScript strictly
- Write reusable components
- Use React hooks properly
- Test components with Jest
- Optimize bundle size
- Follow accessibility standards

### Database

- Write migrations for all schema changes
- Use foreign keys
- Add proper indexes
- Document complex queries
- Keep migrations reversible

### API Design

- Follow RESTful conventions
- Version endpoints
- Use proper HTTP status codes
- Validate all inputs
- Document all endpoints
- Include error handling

## Security Considerations

- [ ] No hardcoded secrets
- [ ] Input validation
- [ ] Output encoding
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

## Performance Considerations

- [ ] Database query optimization
- [ ] Caching strategies
- [ ] Queue for heavy operations
- [ ] Pagination for large datasets
- [ ] Image optimization
- [ ] Bundle size monitoring

## Community

### Getting Help

- 💬 [GitHub Discussions](https://github.com/ajie9988/trensai-crm/discussions)
- 📋 [GitHub Discussions](https://github.com/ajie9988/trensai-crm/discussions)
- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/ajie9988/trensai-crm/issues)

### Recognition

Contributors are recognized in:
- README.md
- GitHub CONTRIBUTORS
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.

## Questions?

- Ask in [GitHub Discussions](https://github.com/ajie9988/trensai-crm/discussions)
- Email: [contributors@example.com](mailto:contributors@example.com)
- GitHub Discussions: [Community Server](https://github.com/ajie9988/trensai-crm/discussions)

---

**Thank you for contributing! 🚀**

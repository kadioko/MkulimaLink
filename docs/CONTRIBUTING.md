# Contributing to MkulimaLink

Thank you for your interest in contributing to MkulimaLink! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/MkulimaLink.git
cd MkulimaLink

# Install dependencies
npm run install-all

# Copy environment file
cp .env.example .env

# Start development databases (Docker)
docker-compose -f docker-compose.dev.yml up -d

# Start development server
npm run dev
```

## 📋 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Your Changes

- Follow the existing code style
- Write tests for new functionality
- Update documentation as needed

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linting
npm run lint
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add group buying notifications"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
```

#### Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🧪 Testing Guidelines

### Backend Tests
- Place tests in `backend/__tests__/`
- Name files as `*.test.js`
- Use Jest and Supertest

```javascript
describe('Feature Name', () => {
  it('should do something', async () => {
    // Test code
  });
});
```

### Frontend Tests
- Place tests alongside components
- Name files as `*.test.js`
- Use React Testing Library

## 📁 Project Structure

```
MkulimaLink/
├── backend/
│   ├── __tests__/     # Backend tests
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   └── utils/         # Utility functions
├── frontend/
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom hooks
│       ├── pages/       # Page components
│       └── utils/       # Utility functions
```

## 🎨 Code Style

### JavaScript
- Use ES6+ features
- Use `const` and `let` (no `var`)
- Use async/await over promises
- Use meaningful variable names

### React
- Functional components with hooks
- Props destructuring
- Use custom hooks for reusable logic

### API Design
- RESTful conventions
- Consistent error responses
- Input validation

## 📝 Pull Request Guidelines

### PR Title
Follow conventional commits format:
```
feat: add equipment rental booking
fix: resolve payment callback issue
```

### PR Description
Include:
- What changes were made
- Why the changes were made
- How to test the changes
- Screenshots (for UI changes)

### PR Checklist
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Sensitive data not exposed

## 🐛 Reporting Bugs

### Bug Report Template
```
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Screenshots**
If applicable.

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
```

## 💡 Feature Requests

### Feature Request Template
```
**Problem**
What problem does this solve?

**Solution**
Describe your proposed solution.

**Alternatives**
Other solutions considered.

**Additional Context**
Any other information.
```

## 📞 Getting Help

- Create an issue for bugs/features
- Email: support@mkulimalink.co.tz
- Check existing issues before creating new ones

## 📜 Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Constructive feedback only
- Help others learn

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MkulimaLink! 🌾

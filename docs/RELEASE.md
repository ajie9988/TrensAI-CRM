# Release Process Guide

This document describes the automated release process for TrensAI CRM using `release-it` and GitHub Actions.

## Overview

The release process is fully automated and includes:
- ✅ Automated version bumping (semantic versioning)
- 📝 Automatic CHANGELOG generation from conventional commits
- 🏷️ Git tag creation
- 📦 GitHub release creation
- 🔄 Automated push to main branch

## Prerequisites

1. **GitHub Token**: You need a personal access token or organization token with the following permissions:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Action workflows)

2. **Local Setup** (if running locally):
   ```bash
   # Set GitHub token as environment variable
   export GITHUB_TOKEN=your_github_token_here
   ```

3. **Conventional Commits**: All commits must follow [conventional commits](https://www.conventionalcommits.org/) format:
   ```
   type(scope): subject
   
   body
   
   footer
   ```

## Available Release Commands

### Local Release (Manual)

1. **Dry Run** - Preview what will be released:
   ```bash
   pnpm release:dry
   ```

2. **Auto Patch Release** (e.g., 1.0.0 → 1.0.1):
   ```bash
   pnpm release:patch
   ```

3. **Auto Minor Release** (e.g., 1.0.0 → 1.1.0):
   ```bash
   pnpm release:minor
   ```

4. **Auto Major Release** (e.g., 1.0.0 → 2.0.0):
   ```bash
   pnpm release:major
   ```

5. **Interactive Release** (choose version interactively):
   ```bash
   pnpm release
   ```

### Automated Release (GitHub Actions)

1. Go to **Actions** tab in GitHub
2. Select **Release** workflow
3. Click **Run workflow**
4. Choose release type: `patch`, `minor`, or `major`
5. Click **Run workflow**

The workflow will:
- Run linter and tests
- Bump version number
- Generate CHANGELOG
- Create git tag
- Push changes to main
- Create GitHub release with auto-generated notes

## Release Workflow Details

### What Happens During a Release

1. **Pre-Release Checks**:
   - Verifies you're on the `main` branch
   - Runs `pnpm lint` to check code quality
   - Runs `pnpm test` to verify functionality

2. **Version Bumping**:
   - Analyzes commits since last release
   - Automatically determines version bump (major/minor/patch)
   - Updates `package.json` version

3. **CHANGELOG Generation**:
   ```
   ✨ Features       (type: feat)
   🐛 Bug Fixes      (type: fix)
   📚 Documentation  (type: docs)
   ⚡ Performance    (type: perf)
   ♻️ Refactoring    (type: refactor)
   ✅ Tests          (type: test)
   ```

4. **Git Operations**:
   - Creates commit: `chore: release v{version}`
   - Creates git tag: `v{version}`
   - Pushes to GitHub

5. **GitHub Release**:
   - Creates release on GitHub
   - Includes generated CHANGELOG
   - Makes it available for download

## Conventional Commit Types

Affects version bumping as follows:

| Type | Version Impact | Example |
|------|---------------|---------|
| `feat` | Minor (v1.0.0 → v1.1.0) | `feat(chat): add typing indicators` |
| `fix` | Patch (v1.0.0 → v1.0.1) | `fix(auth): resolve login issue` |
| `BREAKING CHANGE` | Major (v1.0.0 → v2.0.0) | `feat!: redesign API` or message footer |
| `docs` | No change (hidden) | `docs(readme): update instructions` |
| `style` | No change (hidden) | `style: format code` |
| `chore` | No change (hidden) | `chore: update dependencies` |

## Example Workflow

### Scenario: Releasing v1.1.0 with new features

1. **Create feature branches**:
   ```bash
   git checkout -b feature/new-feature
   # ... make changes ...
   git commit -m "feat(chat): add message search functionality"
   ```

2. **Merge to main**:
   ```bash
   git push origin feature/new-feature
   # Create PR and merge to main
   ```

3. **Run release**:
   ```bash
   pnpm release:minor
   # Or via GitHub Actions: Actions → Release → Run workflow → minor
   ```

4. **Result**:
   - Version bumped: 1.0.0 → 1.1.0
   - CHANGELOG updated with new features
   - Tag created: v1.1.0
   - GitHub release published
   - Available on releases page

## Configuration

### Release Config File
Location: `.release-it.json`

Key settings:
- `git.requireBranch`: Must be on `main` branch
- `github.release`: Create GitHub release
- `@release-it/conventional-changelog`: Use conventional changelog plugin

### Hooks
The following hooks run during release:

**Before Init** (pre-release):
- `pnpm lint` - Code quality check
- `pnpm test` - Run test suite

## Troubleshooting

### "GITHUB_TOKEN not set"
Set your GitHub token:
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

### "Not on main branch"
Switch to main:
```bash
git checkout main
git pull origin main
```

### "No commits since last release"
Release-it needs commits to determine version bump. Make sure there are new commits with conventional commit format.

### "CHANGELOG conflict"
If CHANGELOG.md has merge conflicts:
1. Resolve manually
2. Run: `git add CHANGELOG.md && git commit -m "chore: resolve changelog"`
3. Retry release

### "Lint or test failures"
Fix issues before releasing:
```bash
pnpm lint       # Check for lint errors
pnpm lint:fix   # Auto-fix formatting
pnpm test       # Run test suite
```

## CI/CD Integration

The release workflow is triggered manually via GitHub Actions, which ensures:
- ✅ Consistent environment
- 🔐 Secure token handling
- 📊 Audit trail of releases
- 🔔 Notifications on success/failure

## Best Practices

1. **Always use conventional commits**:
   ```bash
   git commit -m "feat(module): description" # Creates minor bump
   git commit -m "fix(module): description"  # Creates patch bump
   ```

2. **Group related commits**:
   - Multiple fixes in one release
   - Batch features together

3. **Test before releasing**:
   ```bash
   pnpm lint
   pnpm test
   pnpm release:dry  # Preview release
   ```

4. **Review CHANGELOG**:
   - Check generated changelog before confirming
   - Ensure commit messages are clear

5. **Use breaking changes for major updates**:
   ```bash
   git commit -m "feat!: redesign API endpoints"
   # Creates major version bump (v1.0.0 → v2.0.0)
   ```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [release-it Documentation](https://github.com/release-it/release-it)
- [Keep a Changelog](https://keepachangelog.com/)

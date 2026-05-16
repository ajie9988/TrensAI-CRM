# Quick Release Reference

## Local Release (No GitHub Actions needed)

```bash
# Preview what will be released
pnpm release:dry

# Release patch version (1.0.0 → 1.0.1)
pnpm release:patch

# Release minor version (1.0.0 → 1.1.0)
pnpm release:minor

# Release major version (1.0.0 → 2.0.0)
pnpm release:major

# Interactive (choose version)
pnpm release
```

## GitHub Actions Release

1. Go to: **GitHub → Actions → Release**
2. Click: **Run workflow**
3. Select: `patch`, `minor`, or `major`
4. Click: **Run workflow**

## Requirements

✅ Use conventional commits:
- `feat: ...` → minor bump
- `fix: ...` → patch bump  
- `feat!: ...` or `BREAKING CHANGE:` → major bump

✅ Must be on `main` branch

✅ For local releases, set `GITHUB_TOKEN` env var

## What Gets Created

✅ Version bump in `package.json`
✅ Git tag: `v1.0.0`
✅ Commit: `chore: release v1.0.0`
✅ CHANGELOG.md updated
✅ GitHub Release with auto-generated notes

## Example

```bash
# Make and commit changes with conventional format
git commit -m "feat(chat): add message search"
git commit -m "fix(auth): resolve login bug"

# Run release
pnpm release:minor  # or via GitHub Actions

# Result:
# - Version: 1.0.0 → 1.1.0
# - CHANGELOG updated with ✨ Features section
# - Tag v1.1.0 created
# - GitHub release published
```

See [RELEASE.md](RELEASE.md) for detailed documentation.

---
status: accepted
created: 2025-04-13
---

# ADR-006: Desktop Distribution — GitHub Releases

## Decision

Distribute Pixen desktop binaries exclusively via **GitHub Releases** with automated builds via **GitHub Actions**.

## Context

The desktop version (Tauri binary) needs to be:
- Built consistently across platforms (Windows, macOS, Linux)
- Code-signed for user trust
- Versioned and easily found by users
- Downloadable without friction

## Rationale

### GitHub Releases chosen because:

1. **Familiar to Technical Users:** Developers expect to find binaries in GitHub Releases
2. **CDN-Backed Downloads:** Free, unlimited bandwidth via GitHub's CDN
3. **No Infrastructure Cost:** Zero hosting fees
4. **Automatic Versioning:** Releases tied to git tags
5. **CI/CD Integration:** GitHub Actions can build, sign, and publish automatically
6. **Platform Support:** Handles all download statistics natively

### Alternatives Considered

#### Firebase Hosting
- **Pros:** Works for any file type
- **Cons:** Not the convention, users won't look there, added complexity
- **Verdict:** GitHub Releases is the standard

#### Cloudflare R2
- **Pros:** Cheap object storage
- **Cons:** Not discoverable, requires separate infrastructure, users won't look there
- **Verdict:** GitHub Releases is simpler

#### Custom Web Server (AWS S3, etc.)
- **Pros:** Full control
- **Cons:** Requires infrastructure, costs money, setup complexity
- **Verdict:** GitHub Releases is free and standard

#### Electron App Store / Mac App Store
- **Pros:** Native app discovery
- **Cons:** Requires paid developer accounts, review processes, restrictions
- **Verdict:** GitHub Releases has zero friction

## Release Process (Automated)

### 1. Developer Tags a Release

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 2. GitHub Actions Builds & Signs

GitHub Actions workflow (`.github/workflows/release.yml`):
1. Detects tag
2. Builds for Windows, macOS, Linux
3. Code-signs binaries
4. Creates GitHub Release draft
5. Uploads all binaries to release

### 3. Release Published

User sees on GitHub Releases:
```
v0.1.0 - Pixen
├── pixen-0.1.0-x64-en-US.msi (Windows installer)
├── pixen-0.1.0-x64.dmg (macOS Intel)
├── pixen-0.1.0-aarch64.dmg (macOS Apple Silicon)
├── pixen_0.1.0_amd64.AppImage (Linux)
├── pixen_0.1.0_amd64.deb (Linux Debian)
└── CHANGELOG.md (auto-generated from commit messages)
```

## Code Signing Strategy

### macOS
- Requires Apple Developer account ($99/year)
- Signs binaries with certificate
- Users see "verified publisher" in security prompt
- Optional: notarize with Apple (recommended)

### Windows
- Can use self-signed certificate or purchased code-signing cert
- Windows SmartScreen may show warning for self-signed (expected for new publishers)
- After ~1000 downloads, SmartScreen learns app is safe
- Consider purchasing code-signing cert for faster trust ($100-300/year)

### Linux
- No code-signing required
- `.deb` for Debian/Ubuntu (preferred)
- `.AppImage` for universal Linux (portable)

## GitHub Actions Workflow (Skeleton)

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: tauri-apps/tauri-action@v0
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Pixen ${{ github.ref_name }}'
          releaseBody: 'Release notes here'
          releaseDraft: false
          prerelease: false
```

## Auto-Update (Optional, Post-MVP)

Tauri includes `tauri-plugin-updater` for automatic update checks:

1. App checks GitHub Releases on startup
2. If new version available, prompts user
3. Downloads and installs in background
4. Restarts app

This is optional but recommended for user experience.

## Consequences

### Positive
- Zero infrastructure costs
- Familiar to all developers
- Automatic builds via GitHub Actions
- Easy to find and download
- Perfect for open-source distribution
- Native GitHub integration (no external accounts)

### Negative
- GitHub rate limits apply (unlikely to hit them)
- Releases must be on GitHub (not self-hosted)
- Requires GitHub Actions for automation (not applicable to non-GitHub repos)

## Future Considerations

If the project wants to submit to app stores:
1. **Microsoft Store:** Requires paid developer account, can distribute same Tauri binary
2. **Mac App Store:** Requires paid developer account, complex sandboxing
3. **Homebrew/AUR:** Community-maintained; auto-generated from GitHub releases

For MVP, GitHub Releases is the perfect distribution channel.

## Related ADRs

- ADR-004: Desktop Framework (Tauri for cross-platform builds)
- ADR-005: Hosting (Cloudflare Pages for web; GitHub Releases for binaries)

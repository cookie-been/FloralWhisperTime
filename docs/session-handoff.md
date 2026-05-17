# Session Handoff

This file is the fast handoff entry for a new chat session.

## How to resume in a new chat

Send this:

```text
这是延续会话。先阅读：
1. AGENTS.md
2. docs/session-handoff.md
3. README.md
4. docs/README.md
然后检查：
- git status
- git log --oneline -10
最后继续处理：<你的新需求>
不要重复做已经完成的提交、推送和部署。
```

## Update rules

After each meaningful work batch, update:

- current branch
- latest deployed commit
- latest pushed commit
- current live URL
- what is completed
- what is still pending
- known operational pitfalls

Do not write plaintext passwords or secrets here.
Write `see .env` instead.

---

## Current project state

### Repository

- Repo: `/workspace/FloralWhisperTime`
- Branch: `main`
- Working tree: clean at last handoff update

### Live environment

- Live URL: `http://127.0.0.1:8081`
- Deployment entry: `./ops.sh deploy --no-git-pull`
- Latest deployed commit: `248361e`
- `.env` in use: repo root `.env`

### Auth and environment notes

- Admin username: `admin`
- Admin password: see `.env`
- Production-like startup now requires:
  - custom `APP_DATA_ENCRYPTION_KEY`
  - explicit `CORS_ALLOWED_ORIGIN_PATTERNS`
  - explicit `CORS_ALLOWED_HEADERS`
- Deploy scripts were updated so admin login self-check no longer falsely fails when database password state has diverged from `.env`

### Recent completed work

- Added business flower code field and surfaced it in backend, web, and mini app
  - commit: `bec4272`
- Fixed deployment health-check behavior around admin auth state
  - commit: `9cbe3eb`
- Clarified deployment and admin password behavior in docs
  - commit: `c619e67`
- Added reusable delivery-project skill template
  - commit: `d353001`
- Refined the delivery-project skill template with checklist, prompts, and adaptation guide
  - commit: `505c92b`
- Showed flower code in public gallery cards so customers can quote code for offline ordering
  - commit: `034b96c`
- Removed duplicate gallery eyebrow text on the gallery page
  - commit: `248361e`

### Important operational repairs already performed

- Reset admin login state so current `.env` password works again
- Repaired `ai_settings.api_key` encryption state so admin AI settings page and flower admin page load normally under the current encryption key
- Re-deployed after frontend fixes so current live site should reflect:
  - flower code visible in gallery cards
  - only one gallery eyebrow text shown

### Known pitfalls

- Some commands may accidentally resolve to Windows Node/npm instead of WSL Node/npm.
  - Safe build pattern:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd flower-shop-web
npm run build
```

- Admin password behavior:
  - once changed in the admin, database password hash overrides `.env` `ADMIN_PASSWORD`
  - `.env` password is not automatically the active login password after an in-app password change

- AI settings encryption behavior:
  - if `APP_DATA_ENCRYPTION_KEY` changes without re-encrypting stored AI config, admin pages depending on AI settings can fail

### Suggested first checks in a new session

1. `git status`
2. `git log --oneline -10`
3. verify live health:

```bash
curl http://127.0.0.1:8081/api/health
```

4. if the task touches frontend behavior, verify whether deployment is expected before stopping

### Likely next areas of work

- continue frontend/admin cleanup and consistency improvements
- continue deployment / operations / delivery workflow hardening
- potentially design a separate customer operations middle platform for managing multi-customer deployments and maintenance

# Agile Tracker — Project Facts

School assignment ("Agile Tracker"): Kanban board for user stories (Todo / Doing / Done).

## Architecture

FastAPI monolith (Python 3.12, Pydantic v2): serves REST API under `/api/*` and the
vanilla HTML/CSS/JS frontend from `public/` (no build tools). Storage is a JSON file
(`data/stories.json`) with atomic writes — no database.

- `app/main.py` — app setup, static mounting
- `app/routes.py` — API endpoints
- `app/models.py` — Pydantic models
- `app/storage.py` — JSON-file persistence

## Commands

- Tests: `.venv/bin/pytest` (pytest + FastAPI TestClient; no running server or credentials needed)
- Run app: `./start.sh` — creates `.venv` and installs deps if missing, starts uvicorn
  in the background on port 8000 (`PORT` env overrides), logs to `.uvicorn.log`, PID in `.uvicorn.pid`
- Stop / status: `./start.sh stop` / `./start.sh status` (`start.sh` with no args also restarts a running server)

## Conventions

- README and docs/ are written in Estonian — keep documentation edits in Estonian
  (conversation language is separate)
- Workflow rules (issues, branching, testing, merging) come from the global CLAUDE.md — not repeated here

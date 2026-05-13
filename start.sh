#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8000}"
PYTHON="${PYTHON:-python3}"
VENV_DIR=".venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "→ Loon virtuaalkeskkonna ($VENV_DIR)…"
    "$PYTHON" -m venv "$VENV_DIR"
fi

# Aktiveeri venv
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

# Veendu et pip on uuendatud ja sõltuvused installitud
if ! python -c "import fastapi" 2>/dev/null; then
    echo "→ Installin sõltuvused requirements.txt-ist…"
    pip install --quiet --upgrade pip
    pip install --quiet -r requirements.txt
fi

echo "→ Käivitan uvicorn pordil $PORT (Ctrl+C lõpetab)"
exec uvicorn app.main:app --reload --port "$PORT"

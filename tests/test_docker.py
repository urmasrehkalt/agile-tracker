"""Kontrollib Docker-i deploymenti garantiisid ilma Docker'it käivitamata.

Need testid loevad Dockerfile'i ja docker-compose.yml'i ning kinnitavad, et
kriitilised seaded püsivad (andmete säilitamine, 0.0.0.0 sidumine,
healthcheck, taaskäivituspoliitika). Nii ei murene konteiner-seadistus
märkamatult ära.
"""

from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parent.parent
DOCKERFILE = ROOT / "Dockerfile"
COMPOSE = ROOT / "docker-compose.yml"
DOCKERIGNORE = ROOT / ".dockerignore"


@pytest.fixture(scope="module")
def dockerfile_text() -> str:
    return DOCKERFILE.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def compose() -> dict:
    return yaml.safe_load(COMPOSE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def service(compose: dict) -> dict:
    services = compose["services"]
    assert len(services) == 1, "Oodatud üks teenus"
    return next(iter(services.values()))


def test_config_files_exist() -> None:
    assert DOCKERFILE.is_file()
    assert COMPOSE.is_file()
    assert DOCKERIGNORE.is_file()


def test_dockerfile_runs_on_python_312(dockerfile_text: str) -> None:
    assert "python:3.12" in dockerfile_text


def test_dockerfile_installs_pinned_requirements(dockerfile_text: str) -> None:
    assert "requirements.txt" in dockerfile_text


def test_uvicorn_binds_all_interfaces(dockerfile_text: str) -> None:
    """Konteineri sees peab uvicorn kuulama 0.0.0.0, muidu pole hostist ligi."""
    assert "0.0.0.0" in dockerfile_text
    assert "app.main:app" in dockerfile_text


def test_data_volume_persists_state(service: dict) -> None:
    """./data peab olema bind-mount, et story'd, projektid ja mockup'id säiliksid."""
    volumes = service.get("volumes", [])
    assert any(
        v.split(":")[0] == "./data" and v.split(":")[1] == "/app/data"
        for v in volumes
    ), f"Puudub ./data -> /app/data bind-mount: {volumes}"


def test_port_bound_to_localhost(service: dict) -> None:
    """Autentimist pole — port tuleb avada ainult localhostile."""
    ports = [str(p) for p in service.get("ports", [])]
    assert any(p.startswith("127.0.0.1:") and p.endswith(":8000") for p in ports), (
        f"Port peab olema seotud 127.0.0.1-ga: {ports}"
    )


def test_restart_policy_survives_reboot(service: dict) -> None:
    assert service.get("restart") == "unless-stopped"


def test_healthcheck_uses_health_endpoint(service: dict) -> None:
    healthcheck = service.get("healthcheck", {})
    test_cmd = " ".join(healthcheck.get("test", []))
    assert "/api/health" in test_cmd


def test_dockerignore_excludes_data_and_venv() -> None:
    entries = {
        line.strip()
        for line in DOCKERIGNORE.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    }
    assert "data" in entries
    assert ".venv" in entries
    assert ".git" in entries

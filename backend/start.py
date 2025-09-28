import os
import subprocess
import sys
from pathlib import Path


def get_project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def ensure_venv() -> Path:
    backend_dir = Path(__file__).resolve().parent
    venv_dir = backend_dir / ".venv"
    if not venv_dir.exists():
        print("Creating backend virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", str(venv_dir)])
    return venv_dir


def venv_python_path(venv_dir: Path) -> str:
    if os.name == "nt":
        return str(venv_dir / "Scripts" / "python.exe")
    return str(venv_dir / "bin" / "python")


def load_env() -> None:
    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        return
    # Load from project root first, then backend as fallback
    root_env = get_project_root() / ".env"
    backend_env = Path(__file__).resolve().parent / ".env"
    if root_env.exists():
        load_dotenv(dotenv_path=root_env)
    if backend_env.exists():
        load_dotenv(dotenv_path=backend_env, override=True)


def ensure_requirements(venv_python: str) -> None:
    requirements = Path(__file__).with_name("requirements.txt")
    if not requirements.exists():
        print("requirements.txt not found")
        return
    print("Installing backend requirements into venv...")
    subprocess.check_call([venv_python, "-m", "pip", "install", "-r", str(requirements)])


def run(venv_python: str) -> None:
    os.environ.setdefault("PYTHONUNBUFFERED", "1")
    host = os.environ.get("BACKEND_HOST", "0.0.0.0")
    port = os.environ.get("BACKEND_PORT", "8001")
    subprocess.check_call([
        venv_python,
        "-m",
        "uvicorn",
        "server:app",
        "--host",
        host,
        "--port",
        str(port),
        "--reload",
    ])


if __name__ == "__main__":
    load_env()
    venv_dir = ensure_venv()
    venv_python = venv_python_path(venv_dir)
    ensure_requirements(venv_python)
    run(venv_python)



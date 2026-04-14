"""Point d’entrée pour lancer : uvicorn main:app --reload (depuis le dossier backend)."""

from app.main import app

__all__ = ["app"]

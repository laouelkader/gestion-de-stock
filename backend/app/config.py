from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Gestion de stock API"
    database_url: str = "sqlite:///./stock.db"
    # Chaîne « origine1,origine2 » — compatible Docker / .env (pas de JSON obligatoire)
    cors_origins: str = Field(
        default=(
            "http://localhost:5173,"
            "http://127.0.0.1:5173,"
            "http://localhost,"
            "http://127.0.0.1,"
            "http://localhost:3000,"
            "http://127.0.0.1:3000,"
            "http://localhost:8000,"
            "http://127.0.0.1:8000"
        ),
    )

    @computed_field
    @property
    def cors_origins_list(self) -> list[str]:
        return [p.strip() for p in self.cors_origins.split(",") if p.strip()]


settings = Settings()

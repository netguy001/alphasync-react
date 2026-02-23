from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "AlphaSync"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./alphasync.db"

    # JWT
    JWT_SECRET_KEY: str = "alphasync-super-secret-key-change-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Virtual Capital
    DEFAULT_VIRTUAL_CAPITAL: float = 1000000.0  # 10 Lakh INR

    # Market Data
    MARKET_DATA_CACHE_SECONDS: int = 15
    PRICE_STREAM_INTERVAL: float = 3.0

    # 2FA
    TWO_FACTOR_ISSUER: str = "AlphaSync"

    # ── New Architecture Settings ───────────────────────────────────

    # Worker intervals (seconds)
    WORKER_MARKET_DATA_INTERVAL: float = 3.0
    WORKER_ORDER_EXECUTION_INTERVAL: float = 5.0
    WORKER_ALGO_STRATEGY_INTERVAL: float = 30.0

    # Risk Engine defaults
    RISK_MAX_POSITION_SIZE: int = 500
    RISK_MAX_CAPITAL_PER_TRADE: float = 200000.0
    RISK_MAX_PORTFOLIO_EXPOSURE: float = 0.80
    RISK_MAX_DAILY_LOSS: float = 50000.0
    RISK_MAX_OPEN_ORDERS: int = 20

    # Market Session
    SIMULATION_MODE: bool = True  # Allow trading outside market hours

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


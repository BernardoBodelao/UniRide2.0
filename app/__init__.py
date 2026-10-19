import os
from flask import Flask, jsonify
from flask_cors import CORS
from .database import init_db
from .routes.auth import auth_bp
from .routes.rides import rides_bp
from .routes.profile import profile_bp


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true",
    )

    allowed_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
    CORS(app, supports_credentials=True, origins=origins)

    init_db()

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(rides_bp, url_prefix="/api/rides")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Rota não encontrada."}), 404

    @app.errorhandler(500)
    def internal_error(_):
        return jsonify({"error": "Erro interno no servidor."}), 500

    return app

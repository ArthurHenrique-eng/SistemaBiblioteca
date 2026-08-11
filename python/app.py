import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from routes.auth import auth_bp
from routes.livros import livros_bp
from routes.estudantes import estudantes_bp
from routes.emprestimos import emprestimos_bp
from routes.funcionarios import funcionarios_bp

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")
    CORS(app)

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(livros_bp, url_prefix="/api")
    app.register_blueprint(estudantes_bp, url_prefix="/api")
    app.register_blueprint(emprestimos_bp, url_prefix="/api")
    app.register_blueprint(funcionarios_bp, url_prefix="/api")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "online"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"erro": "Rota não encontrada"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"erro": "Erro interno do servidor"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
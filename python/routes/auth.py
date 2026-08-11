from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from db import execute_query

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """RF01 - Login do funcionário"""
    data = request.get_json(silent=True) or {}
    login_input = data.get("login")
    password = data.get("password")

    if not login_input or not password:
        return jsonify({"erro": "Login e senha são obrigatórios"}), 400

    funcionario = execute_query(
        "SELECT * FROM funcionario WHERE login = %s",
        (login_input,),
        fetch_one=True
    )

    if not funcionario or not check_password_hash(funcionario["password"], password):
        return jsonify({"erro": "Credenciais inválidas"}), 401

    return jsonify({
        "mensagem": "Login realizado com sucesso",
        "funcionario": {
            "id_funcionario": funcionario["id_funcionario"],
            "nome": funcionario["nome"],
            "login": funcionario["login"]
        }
    }), 200
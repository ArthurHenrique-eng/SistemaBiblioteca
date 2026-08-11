from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from db import execute_query

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """RF01 - Login único (funcionário ou aluno)"""
    data = request.get_json(silent=True) or {}
    login_input = data.get("login")
    password = data.get("password")

    if not login_input or not password:
        return jsonify({"erro": "Login e senha são obrigatórios"}), 400

    funcionario = execute_query(
        "SELECT * FROM funcionario WHERE login = %s", (login_input,), fetch_one=True
    )
    if funcionario and check_password_hash(funcionario["password"], password):
        return jsonify({
            "mensagem": "Login realizado com sucesso",
            "tipo_usuario": "funcionario",
            "usuario": {
                "id_funcionario": funcionario["id_funcionario"],
                "nome": funcionario["nome"],
                "login": funcionario["login"]
            }
        }), 200

    estudante = execute_query(
        "SELECT * FROM estudante WHERE login = %s", (login_input,), fetch_one=True
    )
    if estudante and estudante["password"] and check_password_hash(estudante["password"], password):
        return jsonify({
            "mensagem": "Login realizado com sucesso",
            "tipo_usuario": "aluno",
            "usuario": {
                "id_estudante": estudante["id_estudante"],
                "nome": estudante["nome"],
                "turma": estudante["turma"],
                "matricula": estudante["matricula"],
                "login": estudante["login"]
            }
        }), 200

    return jsonify({"erro": "Credenciais inválidas"}), 401
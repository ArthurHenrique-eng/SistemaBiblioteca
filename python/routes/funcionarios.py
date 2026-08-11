from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import execute_query

funcionarios_bp = Blueprint("funcionarios", __name__)


@funcionarios_bp.route("/funcionarios", methods=["POST"])
def cadastrar_funcionario():
    data = request.get_json(silent=True) or {}

    if not data.get("nome") or not data.get("login") or not data.get("password"):
        return jsonify({"erro": "Nome, login e senha são obrigatórios"}), 400

    existente = execute_query(
        "SELECT id_funcionario FROM funcionario WHERE login = %s",
        (data.get("login"),), fetch_one=True
    )
    if existente:
        return jsonify({"erro": "Login já cadastrado"}), 409

    senha_hash = generate_password_hash(data.get("password"))

    novo_id = execute_query(
        "INSERT INTO funcionario (login, password, nome) VALUES (%s, %s, %s)",
        (data.get("login"), senha_hash, data.get("nome")),
        commit=True
    )
    return jsonify({"mensagem": "Funcionário cadastrado com sucesso",
                     "id_funcionario": novo_id}), 201


@funcionarios_bp.route("/funcionarios", methods=["GET"])
def listar_funcionarios():
    funcionarios = execute_query(
        "SELECT id_funcionario, nome, login FROM funcionario ORDER BY nome",
        fetch=True
    )
    return jsonify(funcionarios), 200


@funcionarios_bp.route("/funcionarios/<int:id_funcionario>", methods=["DELETE"])
def excluir_funcionario(id_funcionario):
    funcionario = execute_query(
        "SELECT id_funcionario FROM funcionario WHERE id_funcionario = %s",
        (id_funcionario,), fetch_one=True
    )
    if not funcionario:
        return jsonify({"erro": "Funcionário não encontrado"}), 404

    execute_query("DELETE FROM funcionario WHERE id_funcionario = %s",
                  (id_funcionario,), commit=True)
    return jsonify({"mensagem": "Funcionário excluído com sucesso"}), 200
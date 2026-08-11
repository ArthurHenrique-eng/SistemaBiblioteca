from flask import Blueprint, request, jsonify
from db import execute_query

estudantes_bp = Blueprint("estudantes", __name__)


@estudantes_bp.route("/estudantes", methods=["POST"])
def cadastrar_estudante():
    """RF04 - Cadastro de alunos"""
    data = request.get_json(silent=True) or {}

    if not data.get("nome") or not data.get("matricula") or not data.get("turma"):
        return jsonify({"erro": "Nome, turma e matrícula são obrigatórios"}), 400

    existente = execute_query(
        "SELECT id_estudante FROM estudante WHERE matricula = %s",
        (data.get("matricula"),), fetch_one=True
    )
    if existente:
        return jsonify({"erro": "Matrícula já cadastrada"}), 409

    novo_id = execute_query(
        """INSERT INTO estudante (nome, turma, matricula, contato)
           VALUES (%s, %s, %s, %s)""",
        (data.get("nome"), data.get("turma"), data.get("matricula"), data.get("contato")),
        commit=True
    )
    return jsonify({"mensagem": "Aluno cadastrado com sucesso", "id_estudante": novo_id}), 201


@estudantes_bp.route("/estudantes", methods=["GET"])
def consultar_estudantes():
    nome = request.args.get("nome")
    matricula = request.args.get("matricula")

    query = "SELECT * FROM estudante WHERE 1=1"
    params = []

    if nome:
        query += " AND nome LIKE %s"
        params.append(f"%{nome}%")
    if matricula:
        query += " AND matricula = %s"
        params.append(matricula)

    estudantes = execute_query(query, tuple(params), fetch=True)
    return jsonify(estudantes), 200


@estudantes_bp.route("/estudantes/<int:id_estudante>", methods=["GET"])
def obter_estudante(id_estudante):
    estudante = execute_query(
        "SELECT * FROM estudante WHERE id_estudante = %s", (id_estudante,), fetch_one=True
    )
    if not estudante:
        return jsonify({"erro": "Aluno não encontrado"}), 404
    return jsonify(estudante), 200


@estudantes_bp.route("/estudantes/<int:id_estudante>", methods=["PUT"])
def atualizar_estudante(id_estudante):
    data = request.get_json(silent=True) or {}
    estudante = execute_query(
        "SELECT * FROM estudante WHERE id_estudante = %s", (id_estudante,), fetch_one=True
    )
    if not estudante:
        return jsonify({"erro": "Aluno não encontrado"}), 404

    execute_query(
        """UPDATE estudante SET nome=%s, turma=%s, matricula=%s, contato=%s
           WHERE id_estudante=%s""",
        (data.get("nome", estudante["nome"]),
         data.get("turma", estudante["turma"]),
         data.get("matricula", estudante["matricula"]),
         data.get("contato", estudante["contato"]),
         id_estudante),
        commit=True
    )
    return jsonify({"mensagem": "Aluno atualizado com sucesso"}), 200


@estudantes_bp.route("/estudantes/<int:id_estudante>", methods=["DELETE"])
def excluir_estudante(id_estudante):
    estudante = execute_query(
        "SELECT * FROM estudante WHERE id_estudante = %s", (id_estudante,), fetch_one=True
    )
    if not estudante:
        return jsonify({"erro": "Aluno não encontrado"}), 404

    execute_query("DELETE FROM estudante WHERE id_estudante = %s", (id_estudante,), commit=True)
    return jsonify({"mensagem": "Aluno excluído com sucesso"}), 200
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import execute_query
import random

estudantes_bp = Blueprint("estudantes", __name__)


def gerar_matricula_unica():
    """Gera uma matrícula numérica de 5 a 9 dígitos que ainda não existe no banco."""
    for _ in range(20):
        tamanho = random.randint(5, 9)
        candidata = "".join(random.choices("0123456789", k=tamanho))
        existente = execute_query(
            "SELECT id_estudante FROM estudante WHERE matricula = %s",
            (candidata,), fetch_one=True
        )
        if not existente:
            return candidata
    raise RuntimeError("Não foi possível gerar uma matrícula única. Tente novamente.")


@estudantes_bp.route("/estudantes", methods=["POST"])
def cadastrar_estudante():
    """RF04 - Cadastro de alunos"""
    data = request.get_json(silent=True) or {}

    obrigatorios = ["nome", "turma", "login", "password"]
    if not all(data.get(campo) for campo in obrigatorios):
        return jsonify({"erro": "Nome, turma, login e senha são obrigatórios"}), 400

    existente = execute_query(
        "SELECT id_estudante FROM estudante WHERE login = %s",
        (data.get("login"),), fetch_one=True
    )
    if existente:
        return jsonify({"erro": "Login já cadastrado"}), 409

    matricula = gerar_matricula_unica()
    senha_hash = generate_password_hash(data.get("password"))

    novo_id = execute_query(
        """INSERT INTO estudante (nome, turma, matricula, contato, login, password)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (data.get("nome"), data.get("turma"), matricula,
         data.get("contato"), data.get("login"), senha_hash),
        commit=True
    )
    return jsonify({"mensagem": "Aluno cadastrado com sucesso",
                     "id_estudante": novo_id, "matricula": matricula}), 201


@estudantes_bp.route("/estudantes", methods=["GET"])
def consultar_estudantes():
    nome = request.args.get("nome")
    matricula = request.args.get("matricula")

    query = """SELECT id_estudante, nome, turma, matricula, contato, login
               FROM estudante WHERE 1=1"""
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
        """SELECT id_estudante, nome, turma, matricula, contato, login
           FROM estudante WHERE id_estudante = %s""",
        (id_estudante,), fetch_one=True
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
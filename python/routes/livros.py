from flask import Blueprint, request, jsonify
from db import execute_query

livros_bp = Blueprint("livros", __name__)


@livros_bp.route("/livros", methods=["POST"])
def cadastrar_livro():
    """RF02 - Cadastro de livros"""
    data = request.get_json(silent=True) or {}
    campos = ["titulo", "autor", "editora", "ano", "categoria", "quantidade_disponivel"]

    if not data.get("titulo") or not data.get("autor"):
        return jsonify({"erro": "Título e autor são obrigatórios"}), 400

    quantidade = data.get("quantidade_disponivel", 0)

    novo_id = execute_query(
        """INSERT INTO livro (titulo, autor, editora, ano, categoria,
                               quantidade_disponivel, quantidade_total)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (data.get("titulo"), data.get("autor"), data.get("editora"),
         data.get("ano"), data.get("categoria"), quantidade, quantidade),
        commit=True
    )
    return jsonify({"mensagem": "Livro cadastrado com sucesso", "id_livro": novo_id}), 201


@livros_bp.route("/livros", methods=["GET"])
def consultar_livros():
    """RF03 - Consulta de livros por título, autor ou categoria"""
    titulo = request.args.get("titulo")
    autor = request.args.get("autor")
    categoria = request.args.get("categoria")

    query = "SELECT * FROM livro WHERE 1=1"
    params = []

    if titulo:
        query += " AND titulo LIKE %s"
        params.append(f"%{titulo}%")
    if autor:
        query += " AND autor LIKE %s"
        params.append(f"%{autor}%")
    if categoria:
        query += " AND categoria LIKE %s"
        params.append(f"%{categoria}%")

    livros = execute_query(query, tuple(params), fetch=True)
    return jsonify(livros), 200


@livros_bp.route("/livros/<int:id_livro>", methods=["GET"])
def obter_livro(id_livro):
    livro = execute_query(
        "SELECT * FROM livro WHERE id_livro = %s", (id_livro,), fetch_one=True
    )
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404
    return jsonify(livro), 200


@livros_bp.route("/livros/<int:id_livro>", methods=["PUT"])
def atualizar_livro(id_livro):
    data = request.get_json(silent=True) or {}
    livro = execute_query(
        "SELECT * FROM livro WHERE id_livro = %s", (id_livro,), fetch_one=True
    )
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    execute_query(
        """UPDATE livro SET titulo=%s, autor=%s, editora=%s, ano=%s,
                             categoria=%s, quantidade_disponivel=%s, quantidade_total=%s
           WHERE id_livro=%s""",
        (data.get("titulo", livro["titulo"]),
         data.get("autor", livro["autor"]),
         data.get("editora", livro["editora"]),
         data.get("ano", livro["ano"]),
         data.get("categoria", livro["categoria"]),
         data.get("quantidade_disponivel", livro["quantidade_disponivel"]),
         data.get("quantidade_total", livro["quantidade_total"]),
         id_livro),
        commit=True
    )
    return jsonify({"mensagem": "Livro atualizado com sucesso"}), 200


@livros_bp.route("/livros/<int:id_livro>", methods=["DELETE"])
def excluir_livro(id_livro):
    livro = execute_query(
        "SELECT * FROM livro WHERE id_livro = %s", (id_livro,), fetch_one=True
    )
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    execute_query("DELETE FROM livro WHERE id_livro = %s", (id_livro,), commit=True)
    return jsonify({"mensagem": "Livro excluído com sucesso"}), 200
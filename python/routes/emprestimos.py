from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from db import get_connection, execute_query

emprestimos_bp = Blueprint("emprestimos", __name__)


def formatar_datas(registros, campos):
    """Converte objetos date/datetime do MySQL em strings 'YYYY-MM-DD' no JSON."""
    for registro in registros:
        for campo in campos:
            valor = registro.get(campo)
            if valor is not None and hasattr(valor, "isoformat"):
                registro[campo] = valor.isoformat()
    return registros


@emprestimos_bp.route("/emprestimos", methods=["POST"])
def registrar_emprestimo():
    """RF05 - Registro de empréstimo (funcionário) + RF07 - Atualização de disponibilidade"""
    data = request.get_json(silent=True) or {}
    id_estudante = data.get("id_estudante")
    id_livro = data.get("id_livro")
    id_funcionario = data.get("id_funcionario")
    data_devolucao_prevista = data.get("data_devolucao_prevista")

    if not all([id_estudante, id_livro, data_devolucao_prevista]):
        return jsonify({"erro": "id_estudante, id_livro e "
                                 "data_devolucao_prevista são obrigatórios"}), 400

    return _criar_emprestimo(id_estudante, id_livro, id_funcionario, data_devolucao_prevista)


@emprestimos_bp.route("/estudantes/<int:id_estudante>/emprestimos", methods=["POST"])
def autoemprestimo(id_estudante):
    """Autoempréstimo: o próprio aluno pega um livro emprestado, sem funcionário."""
    data = request.get_json(silent=True) or {}
    id_livro = data.get("id_livro")
    dias_emprestimo = data.get("dias_emprestimo", 14)

    if not id_livro:
        return jsonify({"erro": "id_livro é obrigatório"}), 400

    aluno = execute_query(
        "SELECT id_estudante FROM estudante WHERE id_estudante = %s",
        (id_estudante,), fetch_one=True
    )
    if not aluno:
        return jsonify({"erro": "Aluno não encontrado"}), 404

    ja_ativo = execute_query(
        """SELECT id_emprestimo FROM emprestimo
           WHERE id_estudante = %s AND id_livro = %s AND status = 'ativo'""",
        (id_estudante, id_livro), fetch_one=True
    )
    if ja_ativo:
        return jsonify({"erro": "Você já tem um empréstimo ativo deste livro"}), 409

    total_ativos = execute_query(
        "SELECT COUNT(*) AS total FROM emprestimo WHERE id_estudante = %s AND status = 'ativo'",
        (id_estudante,), fetch_one=True
    )
    if total_ativos["total"] >= 3:
        return jsonify({"erro": "Limite de 3 empréstimos simultâneos atingido"}), 409

    data_devolucao_prevista = (date.today() + timedelta(days=int(dias_emprestimo))).isoformat()

    return _criar_emprestimo(id_estudante, id_livro, None, data_devolucao_prevista)


def _criar_emprestimo(id_estudante, id_livro, id_funcionario, data_devolucao_prevista):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM livro WHERE id_livro = %s FOR UPDATE", (id_livro,))
        livro = cursor.fetchone()

        if not livro:
            return jsonify({"erro": "Livro não encontrado"}), 404
        if livro["quantidade_disponivel"] <= 0:
            return jsonify({"erro": "Não há exemplares disponíveis para empréstimo"}), 409

        cursor.execute(
            """INSERT INTO emprestimo
               (id_estudante, id_livro, id_funcionario, data_emprestimo,
                data_devolucao_prevista, status)
               VALUES (%s, %s, %s, %s, %s, 'ativo')""",
            (id_estudante, id_livro, id_funcionario, date.today(), data_devolucao_prevista)
        )
        novo_id = cursor.lastrowid

        cursor.execute(
            "UPDATE livro SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id_livro = %s",
            (id_livro,)
        )

        conn.commit()
        return jsonify({"mensagem": "Empréstimo registrado com sucesso",
                         "id_emprestimo": novo_id,
                         "data_devolucao_prevista": data_devolucao_prevista}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@emprestimos_bp.route("/emprestimos/<int:id_emprestimo>/devolucao", methods=["PUT"])
def registrar_devolucao(id_emprestimo):
    """RF06 - Registro de devolução + RF07 - Atualização de disponibilidade"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM emprestimo WHERE id_emprestimo = %s FOR UPDATE",
                        (id_emprestimo,))
        emprestimo = cursor.fetchone()

        if not emprestimo:
            return jsonify({"erro": "Empréstimo não encontrado"}), 404
        if emprestimo["status"] == "devolvido":
            return jsonify({"erro": "Este empréstimo já foi devolvido"}), 409

        cursor.execute(
            """UPDATE emprestimo SET data_devolucao_real = %s, status = 'devolvido'
               WHERE id_emprestimo = %s""",
            (date.today(), id_emprestimo)
        )
        cursor.execute(
            "UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = %s",
            (emprestimo["id_livro"],)
        )

        conn.commit()
        return jsonify({"mensagem": "Devolução registrada com sucesso"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@emprestimos_bp.route("/emprestimos/ativos", methods=["GET"])
def listar_emprestimos_ativos():
    """RF08 - Listagem de empréstimos ativos"""
    emprestimos = execute_query(
        """SELECT e.id_emprestimo, e.data_emprestimo, e.data_devolucao_prevista, e.status,
                  est.nome AS nome_estudante, est.matricula,
                  l.titulo AS titulo_livro
           FROM emprestimo e
           JOIN estudante est ON est.id_estudante = e.id_estudante
           JOIN livro l ON l.id_livro = e.id_livro
           WHERE e.status = 'ativo'
           ORDER BY e.data_devolucao_prevista ASC""",
        fetch=True
    )
    emprestimos = formatar_datas(emprestimos, ["data_emprestimo", "data_devolucao_prevista"])
    return jsonify(emprestimos), 200


@emprestimos_bp.route("/emprestimos/historico", methods=["GET"])
def historico_emprestimos():
    """RF09 - Histórico simples de empréstimos"""
    id_estudante = request.args.get("id_estudante")

    query = """SELECT e.id_emprestimo, e.data_emprestimo, e.data_devolucao_prevista,
                      e.data_devolucao_real, e.status,
                      est.nome AS nome_estudante, l.titulo AS titulo_livro
               FROM emprestimo e
               JOIN estudante est ON est.id_estudante = e.id_estudante
               JOIN livro l ON l.id_livro = e.id_livro"""
    params = []

    if id_estudante:
        query += " WHERE e.id_estudante = %s"
        params.append(id_estudante)

    query += " ORDER BY e.data_emprestimo DESC"

    emprestimos = execute_query(query, tuple(params), fetch=True)
    emprestimos = formatar_datas(
        emprestimos, ["data_emprestimo", "data_devolucao_prevista", "data_devolucao_real"]
    )
    return jsonify(emprestimos), 200


@emprestimos_bp.route("/estudantes/<int:id_estudante>/emprestimos", methods=["GET"])
def meus_emprestimos(id_estudante):
    """Empréstimos (ativos e histórico) de um aluno específico"""
    emprestimos = execute_query(
        """SELECT e.id_emprestimo, e.data_emprestimo, e.data_devolucao_prevista,
                  e.data_devolucao_real, e.status, l.titulo AS titulo_livro
           FROM emprestimo e
           JOIN livro l ON l.id_livro = e.id_livro
           WHERE e.id_estudante = %s
           ORDER BY e.data_emprestimo DESC""",
        (id_estudante,), fetch=True
    )
    emprestimos = formatar_datas(
        emprestimos, ["data_emprestimo", "data_devolucao_prevista", "data_devolucao_real"]
    )
    return jsonify(emprestimos), 200
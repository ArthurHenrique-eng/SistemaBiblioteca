"""
Script utilitário para cadastrar o primeiro funcionário no sistema,
já com a senha protegida por hash (compatível com a rota de login).

Uso:
    python seed_funcionario.py
"""
from werkzeug.security import generate_password_hash
from db import execute_query

if __name__ == "__main__":
    nome = input("Nome do funcionário: ")
    login = input("Login: ")
    senha = input("Senha: ")

    senha_hash = generate_password_hash(senha)

    execute_query(
        "INSERT INTO funcionario (login, password, nome) VALUES (%s, %s, %s)",
        (login, senha_hash, nome),
        commit=True
    )
    print(f"Funcionário '{nome}' cadastrado com sucesso!")
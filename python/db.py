import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "biblioteca_escolar"),
}

pool = pooling.MySQLConnectionPool(
    pool_name="biblioteca_pool",
    pool_size=5,
    **dbconfig
)


def get_connection():
    """Retorna uma conexão do pool para ser usada em uma requisição."""
    return pool.get_connection()


def execute_query(query, params=None, fetch=False, fetch_one=False, commit=False):
    """
    Executa uma query no banco.
    - fetch=True: retorna todas as linhas (list de dict)
    - fetch_one=True: retorna uma única linha (dict)
    - commit=True: usado para INSERT/UPDATE/DELETE
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())

        result = None
        if fetch:
            result = cursor.fetchall()
        elif fetch_one:
            result = cursor.fetchone()

        if commit:
            conn.commit()
            result = cursor.lastrowid

        return result
    finally:
        cursor.close()
        conn.close()
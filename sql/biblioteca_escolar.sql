-- Active: 1786403871163@@127.0.0.1@3307@biblioteca_escolar
CREATE DATABASE IF NOT EXISTS biblioteca_escolar;
USE biblioteca_escolar;

-- Tabela Funcionário
CREATE TABLE funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL
);

-- Tabela Estudante
CREATE TABLE estudante (
    id_estudante INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    turma VARCHAR(20) NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    contato VARCHAR(50)
);

-- Tabela Livro
CREATE TABLE livro (
    id_livro INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    editora VARCHAR(100),
    ano INT,
    categoria VARCHAR(50),
    quantidade_disponivel INT NOT NULL DEFAULT 0,
    quantidade_total INT NOT NULL DEFAULT 0
);

-- Tabela Empréstimo
CREATE TABLE emprestimo (
    id_emprestimo INT AUTO_INCREMENT PRIMARY KEY,
    id_estudante INT NOT NULL,
    id_livro INT NOT NULL,
    id_funcionario INT NOT NULL,
    data_emprestimo DATE NOT NULL,
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_real DATE,
    status ENUM('ativo', 'devolvido', 'atrasado') NOT NULL DEFAULT 'ativo',

    CONSTRAINT fk_emprestimo_estudante FOREIGN KEY (id_estudante)
        REFERENCES estudante(id_estudante)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_emprestimo_livro FOREIGN KEY (id_livro)
        REFERENCES livro(id_livro)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_emprestimo_funcionario FOREIGN KEY (id_funcionario)
        REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Índices auxiliares para consultas frequentes
CREATE INDEX idx_livro_titulo ON livro(titulo);
CREATE INDEX idx_livro_autor ON livro(autor);
CREATE INDEX idx_livro_categoria ON livro(categoria);
CREATE INDEX idx_emprestimo_status ON emprestimo(status);
CREATE INDEX idx_estudante_matricula ON estudante(matricula);

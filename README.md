# SistemaBiblioteca
Sistema web de gerenciamento para bibliotecas escolares — controle de livros, alunos, empréstimos e devoluções. HTML/CSS/JS, API Python e MySQL.

## Sobre o projeto

Aplicação desenvolvida para auxiliar uma pequena biblioteca escolar de ensino médio no controle do acervo, dos alunos cadastrados e das movimentações de empréstimo e devolução de livros.

## Tecnologias

- **Front-end:** HTML, CSS e JavaScript
- **Back-end:** API em Python
- **Banco de dados:** MySQL

## Usuários do sistema

- **Bibliotecário/Funcionário:** responsável pelo cadastro de livros, cadastro de alunos e controle de empréstimos.
- **Aluno:** pode consultar os livros disponíveis.

## Funcionalidades

- Login administrativo do funcionário
- Cadastro e consulta de livros (título, autor, editora, ano, categoria, quantidade disponível)
- Cadastro de alunos (nome, turma, matrícula, contato)
- Registro de empréstimos e devoluções
- Atualização automática da disponibilidade dos livros
- Listagem de empréstimos ativos
- Histórico de empréstimos realizados

## Estrutura de telas

- Tela de login
- Tela principal
- Cadastro e consulta de livros
- Cadastro e consulta de alunos
- Controle de empréstimos
- Controle de devoluções
- Listagem de empréstimos ativos

## Modelo de dados

O sistema é estruturado em quatro classes principais: **Funcionário**, **Estudante**, **Empréstimo** e **Livro**, com o Empréstimo relacionando alunos a livros e controlando datas e status da transação.

## Requisitos não funcionais

- Interface simples e de fácil uso
- Compatibilidade com navegadores modernos (Chrome, Edge, Firefox)
- Bom desempenho para bibliotecas de pequeno porte
- Acesso administrativo protegido por login e senha
- Armazenamento organizado e seguro em MySQL
- Código organizado para facilitar manutenção
- Responsividade básica para telas de computador e notebook

## Mapa mental do sistema

![Mapa mental do sistema](/docs/Mapa-Sistema-Biblioteca.png)


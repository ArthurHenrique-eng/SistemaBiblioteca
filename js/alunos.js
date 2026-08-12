document.addEventListener("DOMContentLoaded", () => {
  const sessao = protegerPagina(["funcionario"]);
  if (!sessao) return;

  carregarAlunos();

  document.getElementById("btn-novo-aluno").addEventListener("click", () => {
    document.getElementById("modal-aluno").classList.add("show");
  });
  document.getElementById("btn-cancelar-aluno").addEventListener("click", fecharModal);
  document.getElementById("modal-aluno").addEventListener("click", (e) => {
    if (e.target.id === "modal-aluno") fecharModal();
  });
  document.getElementById("form-aluno").addEventListener("submit", cadastrarAluno);
  document.getElementById("btn-buscar").addEventListener("click", carregarAlunos);
  document.getElementById("btn-limpar").addEventListener("click", () => {
    document.getElementById("filtro-nome").value = "";
    document.getElementById("filtro-matricula").value = "";
    carregarAlunos();
  });
});

function fecharModal() {
  document.getElementById("modal-aluno").classList.remove("show");
  document.getElementById("form-aluno").reset();
}

async function carregarAlunos() {
  const corpoTabela = document.getElementById("tabela-alunos");
  const filtros = {};
  const nome = document.getElementById("filtro-nome").value.trim();
  const matricula = document.getElementById("filtro-matricula").value.trim();
  if (nome) filtros.nome = nome;
  if (matricula) filtros.matricula = matricula;

  try {
    const alunos = await Api.listarEstudantes(filtros);
    if (alunos.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum aluno encontrado.</td></tr>`;
      return;
    }
    corpoTabela.innerHTML = alunos.map((a) => `
      <tr>
        <td>${a.nome}</td>
        <td>${a.turma}</td>
        <td class="mono">${a.matricula}</td>
        <td class="mono">${a.login || "—"}</td>
        <td>${a.contato || "—"}</td>
        <td style="text-align:right;">
          <button class="btn btn-danger-ghost btn-sm" data-excluir="${a.id_estudante}" data-nome="${a.nome}">Excluir</button>
        </td>
      </tr>`).join("");

    document.querySelectorAll("[data-excluir]").forEach((btn) =>
      btn.addEventListener("click", () => excluirAluno(btn.dataset.excluir, btn.dataset.nome)));
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

async function cadastrarAluno(event) {
  event.preventDefault();
  const dados = {
    nome: document.getElementById("aluno-nome").value.trim(),
    turma: document.getElementById("aluno-turma").value.trim(),
    contato: document.getElementById("aluno-contato").value.trim(),
    login: document.getElementById("aluno-login").value.trim(),
    password: document.getElementById("aluno-senha").value,
  };

  try {
    const resposta = await Api.cadastrarEstudante(dados);
    mostrarToast(`Aluno cadastrado. Matrícula gerada: ${resposta.matricula}`);
    fecharModal();
    carregarAlunos();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

async function excluirAluno(id, nome) {
  if (!confirm(`Excluir o aluno "${nome}"? Essa ação não pode ser desfeita.`)) return;
  try {
    await Api.excluirEstudante(id);
    mostrarToast("Aluno excluído.");
    carregarAlunos();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}
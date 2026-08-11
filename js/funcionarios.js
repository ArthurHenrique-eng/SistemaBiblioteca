document.addEventListener("DOMContentLoaded", () => {
  const sessao = protegerPagina(["funcionario"]);
  if (!sessao) return;

  carregarFuncionarios();

  document.getElementById("btn-novo-funcionario").addEventListener("click", () => {
    document.getElementById("modal-funcionario").classList.add("show");
  });
  document.getElementById("btn-cancelar-funcionario").addEventListener("click", fecharModal);
  document.getElementById("modal-funcionario").addEventListener("click", (e) => {
    if (e.target.id === "modal-funcionario") fecharModal();
  });
  document.getElementById("form-funcionario").addEventListener("submit", cadastrarFuncionario);
});

function fecharModal() {
  document.getElementById("modal-funcionario").classList.remove("show");
  document.getElementById("form-funcionario").reset();
}

async function carregarFuncionarios() {
  const corpoTabela = document.getElementById("tabela-funcionarios");
  const usuarioAtual = Session.usuario();

  try {
    const funcionarios = await Api.listarFuncionarios();
    if (funcionarios.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="3" class="empty-state">Nenhum funcionário cadastrado.</td></tr>`;
      return;
    }
    corpoTabela.innerHTML = funcionarios.map((f) => {
      const souEu = f.id_funcionario === usuarioAtual.id_funcionario;
      return `
        <tr>
          <td>${f.nome}${souEu ? ' <span class="badge ativo" style="margin-left:6px;">Você</span>' : ""}</td>
          <td class="mono">${f.login}</td>
          <td style="text-align:right;">
            ${souEu ? "" : `<button class="btn btn-danger-ghost btn-sm" data-excluir="${f.id_funcionario}" data-nome="${f.nome}">Excluir</button>`}
          </td>
        </tr>`;
    }).join("");

    document.querySelectorAll("[data-excluir]").forEach((btn) =>
      btn.addEventListener("click", () => excluirFuncionario(btn.dataset.excluir, btn.dataset.nome)));
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="3" class="empty-state">${err.message}</td></tr>`;
  }
}

async function cadastrarFuncionario(event) {
  event.preventDefault();
  const dados = {
    nome: document.getElementById("func-nome").value.trim(),
    login: document.getElementById("func-login").value.trim(),
    password: document.getElementById("func-senha").value,
  };

  try {
    await Api.cadastrarFuncionario(dados);
    mostrarToast("Funcionário cadastrado com sucesso.");
    fecharModal();
    carregarFuncionarios();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

async function excluirFuncionario(id, nome) {
  if (!confirm(`Excluir o funcionário "${nome}"? Essa ação não pode ser desfeita.`)) return;
  try {
    await Api.excluirFuncionario(id);
    mostrarToast("Funcionário excluído.");
    carregarFuncionarios();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const sessao = protegerPagina(["funcionario"]);
  if (!sessao) return;

  carregarAtivos();
  configurarTabs();

  document.getElementById("btn-novo-emprestimo").addEventListener("click", abrirModalEmprestimo);
  document.getElementById("btn-cancelar-emprestimo").addEventListener("click", fecharModal);
  document.getElementById("modal-emprestimo").addEventListener("click", (e) => {
    if (e.target.id === "modal-emprestimo") fecharModal();
  });
  document.getElementById("form-emprestimo").addEventListener("submit", registrarEmprestimo);
});

function configurarTabs() {
  const tabAtivos = document.getElementById("tab-ativos");
  const tabHistorico = document.getElementById("tab-historico");
  const painelAtivos = document.getElementById("painel-ativos");
  const painelHistorico = document.getElementById("painel-historico");

  tabAtivos.addEventListener("click", () => {
    painelAtivos.style.display = "block";
    painelHistorico.style.display = "none";
  });
  tabHistorico.addEventListener("click", () => {
    painelAtivos.style.display = "none";
    painelHistorico.style.display = "block";
    carregarHistorico();
  });
}

async function carregarAtivos() {
  const corpoTabela = document.getElementById("tabela-ativos");
  try {
    const ativos = await Api.listarEmprestimosAtivos();
    if (ativos.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum empréstimo ativo no momento.</td></tr>`;
      return;
    }
    const hoje = new Date().toISOString().split("T")[0];
    corpoTabela.innerHTML = ativos.map((e) => {
      const atrasado = e.data_devolucao_prevista < hoje;
      return `
        <tr>
          <td>${e.nome_estudante}</td>
          <td>${e.titulo_livro}</td>
          <td class="mono">${formatarData(e.data_emprestimo)}</td>
          <td class="mono">${formatarData(e.data_devolucao_prevista)}</td>
          <td>${atrasado ? '<span class="badge atrasado">Atrasado</span>' : '<span class="badge ativo">Em dia</span>'}</td>
          <td style="text-align:right;">
            <button class="btn btn-ghost btn-sm" data-devolver="${e.id_emprestimo}" data-titulo="${e.titulo_livro}">Registrar devolução</button>
          </td>
        </tr>`;
    }).join("");

    document.querySelectorAll("[data-devolver]").forEach((btn) =>
      btn.addEventListener("click", () => registrarDevolucao(btn.dataset.devolver, btn.dataset.titulo)));
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

async function carregarHistorico() {
  const corpoTabela = document.getElementById("tabela-historico");
  try {
    const historico = await Api.historicoEmprestimos();
    if (historico.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum registro no histórico.</td></tr>`;
      return;
    }
    corpoTabela.innerHTML = historico.map((e) => `
      <tr>
        <td>${e.nome_estudante}</td>
        <td>${e.titulo_livro}</td>
        <td class="mono">${formatarData(e.data_emprestimo)}</td>
        <td class="mono">${e.data_devolucao_real ? formatarData(e.data_devolucao_real) : "—"}</td>
        <td><span class="badge ${e.status}">${e.status === "devolvido" ? "Devolvido" : "Ativo"}</span></td>
      </tr>`).join("");
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

async function abrirModalEmprestimo() {
  const selectAluno = document.getElementById("emp-aluno");
  const selectLivro = document.getElementById("emp-livro");

  try {
    const [alunos, livros] = await Promise.all([Api.listarEstudantes(), Api.listarLivros()]);

    selectAluno.innerHTML = '<option value="">Selecione...</option>' +
      alunos.map((a) => `<option value="${a.id_estudante}">${a.nome} — ${a.turma}</option>`).join("");

    const livrosDisponiveis = livros.filter((l) => l.quantidade_disponivel > 0);
    selectLivro.innerHTML = livrosDisponiveis.length
      ? '<option value="">Selecione...</option>' +
        livrosDisponiveis.map((l) => `<option value="${l.id_livro}">${l.titulo} (${l.quantidade_disponivel} disp.)</option>`).join("")
      : '<option value="">Nenhum livro disponível</option>';

    document.getElementById("modal-emprestimo").classList.add("show");
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

function fecharModal() {
  document.getElementById("modal-emprestimo").classList.remove("show");
  document.getElementById("form-emprestimo").reset();
}

async function registrarEmprestimo(event) {
  event.preventDefault();
  const usuario = Session.usuario();

  const dados = {
    id_estudante: Number(document.getElementById("emp-aluno").value),
    id_livro: Number(document.getElementById("emp-livro").value),
    id_funcionario: usuario.id_funcionario,
    data_devolucao_prevista: document.getElementById("emp-data-prevista").value,
  };

  try {
    await Api.registrarEmprestimo(dados);
    mostrarToast("Empréstimo registrado com sucesso.");
    fecharModal();
    carregarAtivos();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

async function registrarDevolucao(idEmprestimo, tituloLivro) {
  if (!confirm(`Confirmar devolução de "${tituloLivro}"?`)) return;
  try {
    await Api.registrarDevolucao(idEmprestimo);
    mostrarToast("Devolução registrada com sucesso.");
    carregarAtivos();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

function formatarData(dataISO) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}
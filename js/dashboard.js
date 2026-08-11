document.addEventListener("DOMContentLoaded", async () => {
  const sessao = protegerPagina(["funcionario"]);
  if (!sessao) return;

  try {
    const [livros, alunos, ativos] = await Promise.all([
      Api.listarLivros(),
      Api.listarEstudantes(),
      Api.listarEmprestimosAtivos(),
    ]);

    document.getElementById("stat-livros").textContent = livros.length;
    document.getElementById("stat-alunos").textContent = alunos.length;
    document.getElementById("stat-ativos").textContent = ativos.length;

    const hoje = new Date().toISOString().split("T")[0];
    const atrasados = ativos.filter((e) => e.data_devolucao_prevista < hoje);
    document.getElementById("stat-atrasados").textContent = atrasados.length;

    const corpoTabela = document.getElementById("tabela-recentes");
    if (ativos.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum empréstimo ativo no momento.</td></tr>`;
    } else {
      corpoTabela.innerHTML = ativos.slice(0, 6).map((e) => {
        const atrasado = e.data_devolucao_prevista < hoje;
        return `
          <tr>
            <td>${e.nome_estudante}</td>
            <td>${e.titulo_livro}</td>
            <td class="mono">${formatarData(e.data_devolucao_prevista)}</td>
            <td>${atrasado ? '<span class="badge atrasado">Atrasado</span>' : '<span class="badge ativo">Em dia</span>'}</td>
          </tr>`;
      }).join("");
    }
  } catch (err) {
    mostrarToast(err.message, "error");
  }
});

function formatarData(dataISO) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}
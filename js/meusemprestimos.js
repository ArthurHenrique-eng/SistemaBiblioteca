document.addEventListener("DOMContentLoaded", () => {
  const sessao = protegerPagina(["aluno"]);
  if (!sessao) return;

  carregarMeusEmprestimos(sessao.usuario.id_estudante);
  configurarTabs();

  document.getElementById("btn-buscar-catalogo").addEventListener("click", carregarCatalogo);
});

function configurarTabs() {
  const tabMeus = document.getElementById("tab-meus");
  const tabCatalogo = document.getElementById("tab-catalogo");
  const painelMeus = document.getElementById("painel-meus");
  const painelCatalogo = document.getElementById("painel-catalogo");

  tabMeus.addEventListener("click", () => {
    painelMeus.style.display = "block";
    painelCatalogo.style.display = "none";
  });
  tabCatalogo.addEventListener("click", () => {
    painelMeus.style.display = "none";
    painelCatalogo.style.display = "block";
    carregarCatalogo();
  });
}

async function carregarMeusEmprestimos(idEstudante) {
  const corpoTabela = document.getElementById("tabela-meus-emprestimos");
  try {
    const emprestimos = await Api.meusEmprestimos(idEstudante);
    if (emprestimos.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="4" class="empty-state">Você ainda não fez nenhum empréstimo.</td></tr>`;
      return;
    }
    const hoje = new Date().toISOString().split("T")[0];
    corpoTabela.innerHTML = emprestimos.map((e) => {
      let statusHtml;
      if (e.status === "devolvido") {
        statusHtml = '<span class="badge devolvido">Devolvido</span>';
      } else if (e.data_devolucao_prevista < hoje) {
        statusHtml = '<span class="badge atrasado">Atrasado</span>';
      } else {
        statusHtml = '<span class="badge ativo">Em dia</span>';
      }
      return `
        <tr>
          <td>${e.titulo_livro}</td>
          <td class="mono">${formatarData(e.data_emprestimo)}</td>
          <td class="mono">${formatarData(e.data_devolucao_prevista)}</td>
          <td>${statusHtml}</td>
        </tr>`;
    }).join("");
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
  }
}

async function carregarCatalogo() {
  const corpoTabela = document.getElementById("tabela-catalogo");
  const filtros = {};
  const titulo = document.getElementById("filtro-titulo").value.trim();
  const autor = document.getElementById("filtro-autor").value.trim();
  const categoria = document.getElementById("filtro-categoria").value.trim();
  if (titulo) filtros.titulo = titulo;
  if (autor) filtros.autor = autor;
  if (categoria) filtros.categoria = categoria;

  try {
    const livros = await Api.listarLivros(filtros);
    if (livros.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum livro encontrado.</td></tr>`;
      return;
    }
    corpoTabela.innerHTML = livros.map((l) => {
      let statusHtml;
      if (l.quantidade_disponivel === 0) {
        statusHtml = '<span class="status-pulse out"><span class="dot"></span>Indisponível</span>';
      } else if (l.quantidade_disponivel <= 2) {
        statusHtml = `<span class="status-pulse low"><span class="dot"></span>${l.quantidade_disponivel} disponível(is)</span>`;
      } else {
        statusHtml = `<span class="status-pulse ok"><span class="dot"></span>${l.quantidade_disponivel} disponíveis</span>`;
      }
      return `
        <tr>
          <td>${l.titulo}</td>
          <td>${l.autor}</td>
          <td>${l.categoria || "—"}</td>
          <td class="mono">${l.ano || "—"}</td>
          <td>${statusHtml}</td>
        </tr>`;
    }).join("");
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

function formatarData(dataISO) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}
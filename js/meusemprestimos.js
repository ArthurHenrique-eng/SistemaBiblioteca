let idEstudanteAtual = null;

document.addEventListener("DOMContentLoaded", () => {
  const sessao = protegerPagina(["aluno"]);
  if (!sessao) return;

  idEstudanteAtual = sessao.usuario.id_estudante;
  carregarMeusEmprestimos(idEstudanteAtual);
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
      corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum livro encontrado.</td></tr>`;
      return;
    }
    corpoTabela.innerHTML = livros.map((l) => {
      let statusHtml;
      let botaoHtml;
      if (l.quantidade_disponivel === 0) {
        statusHtml = '<span class="status-pulse out"><span class="dot"></span>Indisponível</span>';
        botaoHtml = `<button class="btn btn-ghost btn-sm" disabled>Indisponível</button>`;
      } else if (l.quantidade_disponivel <= 2) {
        statusHtml = `<span class="status-pulse low"><span class="dot"></span>${l.quantidade_disponivel} disponível(is)</span>`;
        botaoHtml = `<button class="btn btn-primary btn-sm" data-emprestar="${l.id_livro}" data-titulo="${l.titulo}">Solicitar</button>`;
      } else {
        statusHtml = `<span class="status-pulse ok"><span class="dot"></span>${l.quantidade_disponivel} disponíveis</span>`;
        botaoHtml = `<button class="btn btn-primary btn-sm" data-emprestar="${l.id_livro}" data-titulo="${l.titulo}">Solicitar</button>`;
      }
      return `
        <tr>
          <td>${l.titulo}</td>
          <td>${l.autor}</td>
          <td>${l.categoria || "—"}</td>
          <td class="mono">${l.ano || "—"}</td>
          <td>${statusHtml}</td>
          <td style="text-align:right;">${botaoHtml}</td>
        </tr>`;
    }).join("");

    document.querySelectorAll("[data-emprestar]").forEach((btn) =>
      btn.addEventListener("click", () => emprestarLivro(btn.dataset.emprestar, btn.dataset.titulo)));
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

async function emprestarLivro(idLivro, tituloLivro) {
  if (!confirm(`Pegar emprestado "${tituloLivro}"? O prazo padrão é de 14 dias.`)) return;
  try {
    const resposta = await Api.autoEmprestimo(idEstudanteAtual, idLivro);
    mostrarToast(`Empréstimo confirmado. Devolução até ${formatarData(resposta.data_devolucao_prevista)}.`);
    carregarCatalogo();
    carregarMeusEmprestimos(idEstudanteAtual);
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

function formatarData(dataISO) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}
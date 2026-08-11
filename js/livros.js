let livroEditandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  const sessao = protegerPagina(["funcionario"]);
  if (!sessao) return;

  carregarLivros();

  document.getElementById("btn-novo-livro").addEventListener("click", () => abrirModal());
  document.getElementById("btn-cancelar-livro").addEventListener("click", fecharModal);
  document.getElementById("modal-livro").addEventListener("click", (e) => {
    if (e.target.id === "modal-livro") fecharModal();
  });
  document.getElementById("form-livro").addEventListener("submit", salvarLivro);
  document.getElementById("btn-buscar").addEventListener("click", carregarLivros);
  document.getElementById("btn-limpar").addEventListener("click", () => {
    document.getElementById("filtro-titulo").value = "";
    document.getElementById("filtro-autor").value = "";
    document.getElementById("filtro-categoria").value = "";
    carregarLivros();
  });
});

async function carregarLivros() {
  const corpoTabela = document.getElementById("tabela-livros");
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
    corpoTabela.innerHTML = livros.map(renderLinhaLivro).join("");

    document.querySelectorAll("[data-editar]").forEach((btn) =>
      btn.addEventListener("click", () => abrirModal(JSON.parse(btn.dataset.editar))));
    document.querySelectorAll("[data-excluir]").forEach((btn) =>
      btn.addEventListener("click", () => excluirLivro(btn.dataset.excluir, btn.dataset.nome)));
  } catch (err) {
    corpoTabela.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderLinhaLivro(livro) {
  const disponivel = livro.quantidade_disponivel;
  let statusHtml;
  if (disponivel === 0) {
    statusHtml = `<span class="status-pulse out"><span class="dot"></span>Indisponível</span>`;
  } else if (disponivel <= 2) {
    statusHtml = `<span class="status-pulse low"><span class="dot"></span>${disponivel} disponível(is)</span>`;
  } else {
    statusHtml = `<span class="status-pulse ok"><span class="dot"></span>${disponivel} disponíveis</span>`;
  }

  return `
    <tr>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.categoria || "—"}</td>
      <td class="mono">${livro.ano || "—"}</td>
      <td>${statusHtml}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" data-editar='${JSON.stringify(livro)}'>Editar</button>
        <button class="btn btn-danger-ghost btn-sm" data-excluir="${livro.id_livro}" data-nome="${livro.titulo}">Excluir</button>
      </td>
    </tr>`;
}

function abrirModal(livro = null) {
  livroEditandoId = livro ? livro.id_livro : null;
  document.getElementById("modal-titulo").textContent = livro ? "Editar livro" : "Novo livro";
  document.getElementById("livro-titulo").value = livro?.titulo || "";
  document.getElementById("livro-autor").value = livro?.autor || "";
  document.getElementById("livro-editora").value = livro?.editora || "";
  document.getElementById("livro-ano").value = livro?.ano || "";
  document.getElementById("livro-categoria").value = livro?.categoria || "";
  document.getElementById("livro-quantidade").value = livro?.quantidade_disponivel ?? "";
  document.getElementById("modal-livro").classList.add("show");
}

function fecharModal() {
  document.getElementById("modal-livro").classList.remove("show");
  document.getElementById("form-livro").reset();
}

async function salvarLivro(event) {
  event.preventDefault();
  const dados = {
    titulo: document.getElementById("livro-titulo").value.trim(),
    autor: document.getElementById("livro-autor").value.trim(),
    editora: document.getElementById("livro-editora").value.trim(),
    ano: document.getElementById("livro-ano").value || null,
    categoria: document.getElementById("livro-categoria").value.trim(),
    quantidade_disponivel: Number(document.getElementById("livro-quantidade").value),
  };

  try {
    if (livroEditandoId) {
      await Api.atualizarLivro(livroEditandoId, dados);
      mostrarToast("Livro atualizado com sucesso.");
    } else {
      dados.quantidade_total = dados.quantidade_disponivel;
      await Api.cadastrarLivro(dados);
      mostrarToast("Livro cadastrado com sucesso.");
    }
    fecharModal();
    carregarLivros();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}

async function excluirLivro(id, nome) {
  if (!confirm(`Excluir o livro "${nome}"? Essa ação não pode ser desfeita.`)) return;
  try {
    await Api.excluirLivro(id);
    mostrarToast("Livro excluído.");
    carregarLivros();
  } catch (err) {
    mostrarToast(err.message, "error");
  }
}
/* ==========================================================================
   auth-guard.js — Sessão, controle de acesso e utilidades de UI compartilhadas
   ========================================================================== */

const Session = {
  salvar(tipoUsuario, usuario) {
    localStorage.setItem("biblioteca_tipo", tipoUsuario);
    localStorage.setItem("biblioteca_usuario", JSON.stringify(usuario));
  },
  tipo() {
    return localStorage.getItem("biblioteca_tipo");
  },
  usuario() {
    const raw = localStorage.getItem("biblioteca_usuario");
    return raw ? JSON.parse(raw) : null;
  },
  logout() {
    localStorage.removeItem("biblioteca_tipo");
    localStorage.removeItem("biblioteca_usuario");
    window.location.href = "login.html";
  },
};

/**
 * Chame no topo de cada página protegida.
 * papeisPermitidos: array com "funcionario" e/ou "aluno".
 */
function protegerPagina(papeisPermitidos) {
  const tipo = Session.tipo();
  const usuario = Session.usuario();

  if (!tipo || !usuario) {
    window.location.href = "login.html";
    return null;
  }

  if (!papeisPermitidos.includes(tipo)) {
    window.location.href = tipo === "funcionario" ? "dashboard.html" : "meus-emprestimos.html";
    return null;
  }

  preencherUsuarioNaSidebar(usuario, tipo);
  return { tipo, usuario };
}

function preencherUsuarioNaSidebar(usuario, tipo) {
  const nomeEl = document.querySelector("[data-user-name]");
  const roleEl = document.querySelector("[data-user-role]");
  if (nomeEl) nomeEl.textContent = usuario.nome;
  if (roleEl) roleEl.textContent = tipo === "funcionario" ? "Funcionário" : "Aluno";
}

function configurarLogout() {
  const btn = document.querySelector("[data-logout]");
  if (btn) btn.addEventListener("click", () => Session.logout());
}

function configurarMenuMobile() {
  const hamburger = document.querySelector("[data-hamburger]");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector("[data-sidebar-overlay]");
  if (!hamburger || !sidebar || !overlay) return;

  const abrir = () => { sidebar.classList.add("open"); overlay.classList.add("show"); };
  const fechar = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };

  hamburger.addEventListener("click", abrir);
  overlay.addEventListener("click", fechar);
}

/* ---------- Toast de feedback ---------- */
function mostrarToast(mensagem, tipo = "success") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  const icone = tipo === "error"
    ? `<svg class="toast-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 8l8 8M16 8l-8 8"/></svg>`
    : `<svg class="toast-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7 12.5l3 3 7-7"/></svg>`;

  toast.innerHTML = `${icone}<span>${mensagem}</span>`;
  toast.className = `toast show ${tipo}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("show"), 3200);
}

function destacarLinkAtivo() {
  const paginaAtual = window.location.pathname.split("/").pop();
  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    if (link.getAttribute("href") === paginaAtual) link.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarLogout();
  configurarMenuMobile();
  destacarLinkAtivo();
});
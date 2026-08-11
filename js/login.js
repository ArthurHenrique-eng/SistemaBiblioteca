document.addEventListener("DOMContentLoaded", () => {
  // Se já houver sessão ativa, pula direto para a área correspondente.
  const tipoExistente = localStorage.getItem("biblioteca_tipo");
  if (tipoExistente === "funcionario") window.location.href = "dashboard.html";
  if (tipoExistente === "aluno") window.location.href = "meus-emprestimos.html";

  const form = document.getElementById("login-form");
  const erroBox = document.getElementById("login-error");
  const btn = document.getElementById("login-btn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    erroBox.classList.remove("show");

    const login = document.getElementById("login").value.trim();
    const password = document.getElementById("password").value;

    btn.disabled = true;
    btn.textContent = "Entrando...";

    try {
      const resposta = await Api.login(login, password);
      localStorage.setItem("biblioteca_tipo", resposta.tipo_usuario);
      localStorage.setItem("biblioteca_usuario", JSON.stringify(resposta.usuario));

      window.location.href = resposta.tipo_usuario === "funcionario"
        ? "dashboard.html"
        : "meus-emprestimos.html";
    } catch (err) {
      erroBox.textContent = err.message;
      erroBox.classList.add("show");
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
});
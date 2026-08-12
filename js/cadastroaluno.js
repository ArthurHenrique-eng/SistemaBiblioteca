document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");
  const erroBox = document.getElementById("cadastro-error");
  const btn = document.getElementById("cadastro-btn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    erroBox.classList.remove("show");

    const senha = document.getElementById("aluno-senha").value;
    const confirmacao = document.getElementById("aluno-senha-confirma").value;

    if (senha !== confirmacao) {
      erroBox.textContent = "As senhas não coincidem.";
      erroBox.classList.add("show");
      return;
    }

    const dados = {
      nome: document.getElementById("aluno-nome").value.trim(),
      turma: document.getElementById("aluno-turma").value.trim(),
      contato: document.getElementById("aluno-contato").value.trim(),
      login: document.getElementById("aluno-login").value.trim(),
      password: senha,
    };

    btn.disabled = true;
    btn.textContent = "Criando conta...";

    try {
      const resposta = await Api.cadastrarEstudante(dados);
      mostrarToastSimples(`Conta criada! Sua matrícula é ${resposta.matricula}. Redirecionando...`);
      setTimeout(() => { window.location.href = "login.html"; }, 2200);
    } catch (err) {
      erroBox.textContent = err.message;
      erroBox.classList.add("show");
      btn.disabled = false;
      btn.textContent = "Criar conta";
    }
  });
});

function mostrarToastSimples(mensagem) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.className = "toast show success";
}
/* ==========================================================================
   api.js — Camada central de comunicação com a API Flask
   ========================================================================== */

const API_BASE_URL = "http://127.0.0.1:5000/api";

/**
 * Executa uma requisição à API e trata erros de forma padronizada.
 */
async function apiRequest(endpoint, { method = "GET", body = null } = {}) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (err) {
    throw new Error("Não foi possível conectar à API. Verifique se o servidor Flask está rodando.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || "Ocorreu um erro na requisição.");
  }

  return data;
}

/* ---------- Autenticação ---------- */
const Api = {
  login: (login, password) =>
    apiRequest("/login", { method: "POST", body: { login, password } }),

  /* ---------- Livros ---------- */
  listarLivros: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return apiRequest(`/livros${params ? `?${params}` : ""}`);
  },
  obterLivro: (id) => apiRequest(`/livros/${id}`),
  cadastrarLivro: (dados) => apiRequest("/livros", { method: "POST", body: dados }),
  atualizarLivro: (id, dados) => apiRequest(`/livros/${id}`, { method: "PUT", body: dados }),
  excluirLivro: (id) => apiRequest(`/livros/${id}`, { method: "DELETE" }),

  /* ---------- Estudantes ---------- */
  listarEstudantes: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return apiRequest(`/estudantes${params ? `?${params}` : ""}`);
  },
  cadastrarEstudante: (dados) => apiRequest("/estudantes", { method: "POST", body: dados }),
  atualizarEstudante: (id, dados) => apiRequest(`/estudantes/${id}`, { method: "PUT", body: dados }),
  excluirEstudante: (id) => apiRequest(`/estudantes/${id}`, { method: "DELETE" }),

  /* ---------- Funcionários ---------- */
  listarFuncionarios: () => apiRequest("/funcionarios"),
  cadastrarFuncionario: (dados) => apiRequest("/funcionarios", { method: "POST", body: dados }),
  excluirFuncionario: (id) => apiRequest(`/funcionarios/${id}`, { method: "DELETE" }),

  /* ---------- Empréstimos ---------- */
  registrarEmprestimo: (dados) => apiRequest("/emprestimos", { method: "POST", body: dados }),
  registrarDevolucao: (id) => apiRequest(`/emprestimos/${id}/devolucao`, { method: "PUT" }),
  listarEmprestimosAtivos: () => apiRequest("/emprestimos/ativos"),
  historicoEmprestimos: (idEstudante = null) => {
    const params = idEstudante ? `?id_estudante=${idEstudante}` : "";
    return apiRequest(`/emprestimos/historico${params}`);
  },
  meusEmprestimos: (idEstudante) => apiRequest(`/estudantes/${idEstudante}/emprestimos`),
};
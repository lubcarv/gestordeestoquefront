const API_BASE_URL = "https://gestordeestoque.onrender.com/swagger-ui/index.html";

async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const config = {
    method: options.method || "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    // Tentar extrair mensagem de erro do backend
    let message = `Erro ${response.status}`;
    try {
      const data = await response.json();
      if (data && (data.message || data.error)) {
        message = data.message || data.error;
      }
    } catch (_) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  // Alguns endpoints 200 sem body
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

// ==================== CATEGORIAS ====================
const CategoriasAPI = {
  async list() {
    return apiRequest("/api/categorias");
  },
  async getById(id) {
    return apiRequest(`/api/categorias/${encodeURIComponent(id)}`);
  },
  async create(payload) {
    return apiRequest("/api/categorias", { method: "POST", body: payload });
  },
  async update(id, payload) {
    return apiRequest(`/api/categorias/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  },
  async remove(id) {
    return apiRequest(`/api/categorias/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async searchByDescricao(descricao) {
    return apiRequest(
      `/api/categorias/descricao/${encodeURIComponent(descricao)}`
    );
  },
};

// Utilitário opcional: sincronizar categorias do backend no armazenamento local
async function syncCategoriasToLocalStorage() {
  try {
    const categorias = await CategoriasAPI.list();
    if (Array.isArray(categorias)) {
      localStorage.setItem("categorias", JSON.stringify(categorias));
    }
  } catch (_) {
    // silencioso: fallback continua funcionando com dados locais
  }
}

// ==================== FORNECEDORES ====================
const FornecedoresAPI = {
  async list() {
    return apiRequest("/api/fornecedores");
  },
  async getById(id) {
    return apiRequest(`/api/fornecedores/${encodeURIComponent(id)}`);
  },
  async create(payload) {
    return apiRequest("/api/fornecedores", { method: "POST", body: payload });
  },
  async update(id, payload) {
    return apiRequest(`/api/fornecedores/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  },
  async remove(id) {
    return apiRequest(`/api/fornecedores/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async searchByNome(nome) {
    return apiRequest(`/api/fornecedores/nome/${encodeURIComponent(nome)}`);
  },
};

// Utilitário opcional: sincronizar fornecedores do backend no armazenamento local
async function syncFornecedoresToLocalStorage() {
  try {
    const fornecedores = await FornecedoresAPI. list();
    if (Array. isArray(fornecedores)) {
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
    }
  } catch (_) {
    // silencioso
  }
}

// ==================== PRODUTOS ====================
const ProdutosAPI = {
  async list() {
    return apiRequest("/api/produtos");
  },
  async getById(id) {
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}`);
  },
  async create(payload) {
    return apiRequest("/api/produtos", { method: "POST", body: payload });
  },
  async update(id, payload) {
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  },
  async remove(id) {
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async retirar(id, quantidade, usuario) {
    const q = new URLSearchParams({
      quantidade: String(quantidade),
      usuario: usuario || "",
    }).toString();
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}/retirar? ${q}`, {
      method: "PUT",
    });
  },
  async repor(id, quantidade, usuario) {
    const q = new URLSearchParams({
      quantidade: String(quantidade),
      usuario: usuario || "",
    }).toString();
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}/repor?${q}`, {
      method: "PUT",
    });
  },
  async inativar(id, usuario) {
    const q = new URLSearchParams({ usuario: usuario || "" }).toString();
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}/inativar?${q}`, {
      method: "PUT",
    });
  },
  async ativar(id, usuario) {
    const q = new URLSearchParams({ usuario: usuario || "" }).toString();
    return apiRequest(`/api/produtos/${encodeURIComponent(id)}/ativar?${q}`, {
      method: "PUT",
    });
  },
  async historico(produtoId) {
    return apiRequest(
      `/api/produtos/${encodeURIComponent(produtoId)}/historico`
    );
  },
  async filtrar(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
    });
    const suffix = q.toString() ? `? ${q.toString()}` : "";
    return apiRequest(`/api/produtos/filtrar${suffix}`);
  },
  async listEstoqueBaixo() {
    return apiRequest(`/api/produtos/estoque-baixo`);
  },
};

// Sincronizar produtos no localStorage, mapeando campos do backend
async function syncProdutosToLocalStorage() {
  try {
    const produtos = await ProdutosAPI.list();
    if (Array.isArray(produtos)) {
      const categoriasLocal = JSON.parse(
        localStorage.getItem("categorias") || "[]"
      );
      const fornecedoresLocal = JSON.parse(
        localStorage.getItem("fornecedores") || "[]"
      );
      const produtosExistentes = JSON. parse(
        localStorage.getItem("produtos") || "[]"
      );

      const mapped = produtos.map((p) => {
        // tentar preservar ids existentes pelo id do produto
        const existente = produtosExistentes.find((e) => e.id === p.id);

        let categoriaId =
          p.categoriaId || (existente ? existente.categoriaId : null);
        if (!categoriaId && p.categoriaNome) {
          const cat = categoriasLocal.find((c) => c.nome === p. categoriaNome);
          if (cat) categoriaId = cat.id;
        }

        let fornecedorId =
          p.fornecedorId || (existente ? existente. fornecedorId : null);
        if (!fornecedorId && p.fornecedorNome) {
          const forn = fornecedoresLocal. find(
            (f) => f.nome === p.fornecedorNome
          );
          if (forn) fornecedorId = forn.id;
        }

        return {
          id: p.id,
          codigo: p.codigo,
          nome: p.nome,
          descricao: p. descricao,
          preco: p.preco,
          unidadeMedida: p.unidadeMedida,
          dimensoes: p.dimensoes,
          cor: p. cor,
          quantidadeMinima: p.quantidadeMinima ?? null,
          quantidadeIdeal: p.quantidadeIdeal ?? null,
          quantidadeMaxima: p. quantidadeMaxima ?? null,
          ativo: p. ativo,
          categoriaId: categoriaId || null,
          fornecedorId: fornecedorId || null,
          estoqueAtual: p. quantidadeEstoque ?? 0,
          estoque: p.estoque ?  {
            quantidade: p.quantidadeEstoque ??  0,
            quantidadeMinima: p.quantidadeMinima ?? 0
          } : null
        };
      });
      localStorage.setItem("produtos", JSON. stringify(mapped));
    }
  } catch (_) {}
}

// ==================== DASHBOARD ====================
const DashboardAPI = {
  async getKPIs(mes, ano) {
    const params = new URLSearchParams();
    if (mes) params. append('mes', mes);
    if (ano) params.append('ano', ano);
    const suffix = params.toString() ? `? ${params.toString()}` : '';
    return apiRequest(`/api/dashboard/kpis${suffix}`);
  },
  
  async getTopVendidos(mes, ano, limite = 10) {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (ano) params.append('ano', ano);
    params.append('limite', limite);
    return apiRequest(`/api/dashboard/top-vendidos?${params.toString()}`);
  },
  
  async getMenosVendidos(mes, ano, limite = 10) {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (ano) params.append('ano', ano);
    params.append('limite', limite);
    return apiRequest(`/api/dashboard/menos-vendidos?${params.toString()}`);
  },
  
  async getCategoriasVendidas(mes, ano) {
    const params = new URLSearchParams();
    if (mes) params. append('mes', mes);
    if (ano) params.append('ano', ano);
    const suffix = params.toString() ? `? ${params.toString()}` : '';
    return apiRequest(`/api/dashboard/categorias-vendidas${suffix}`);
  },
  
  async getMovimentacoesPeriodo(mes, ano) {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (ano) params.append('ano', ano);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/dashboard/movimentacoes-periodo${suffix}`);
  },
  
  async getUltimasMovimentacoes(limite = 10) {
    return apiRequest(`/api/dashboard/ultimas-movimentacoes?limite=${limite}`);
  }
};


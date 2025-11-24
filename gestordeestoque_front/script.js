// Sistema de Gestão de Estoque - JavaScript Principal

// Variáveis globais
let currentEditingId = null;
let currentEditingType = null;

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

async function initializeApp() {
  await setupDataSync();
  setupTabNavigation();
  await loadAllData();
  setupEventListeners();
  showAlert("Sistema carregado com sucesso!", "success");
}

async function setupDataSync() {
  try {
    await syncCategoriasToLocalStorage();
  } catch (_) {}
  try {
    await syncFornecedoresToLocalStorage();
  } catch (_) {}
  try {
    await syncProdutosToLocalStorage();
  } catch (_) {}
}

// Navegação entre abas
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");

      // Load data for the active tab
      loadTabData(targetTab);
    });
  });
}

async function loadAllData() {
  loadTabData("dashboard"); // Carregar dashboard por padrão
  await loadProducts();
  await loadCategories();
  await loadSuppliers();
  loadProductFilters();
  loadEstoqueSelects();
}

// Event Listeners
function setupEventListeners() {
  // Formulários
  document
    .getElementById("productForm")
    .addEventListener("submit", handleProductSubmit);
  document
    .getElementById("categoryForm")
    .addEventListener("submit", handleCategorySubmit);
  document
    .getElementById("supplierForm")
    .addEventListener("submit", handleSupplierSubmit);

  // Fechar modais ao clicar fora
  window.addEventListener("click", function (event) {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  });
}

// Sistema de confirmação
let confirmCallback = null;

function showConfirmModal(title, message, onConfirm, buttonText = "Confirmar", buttonClass = "btn-danger") {
  const modal = document.getElementById("confirmModal");
  const titleEl = document.getElementById("confirmModalTitle");
  const messageEl = document.getElementById("confirmModalMessage");
  const buttonEl = document.getElementById("confirmModalButton");
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  buttonEl.textContent = buttonText;
  buttonEl.className = `btn ${buttonClass}`;
  
  confirmCallback = onConfirm;
  modal.classList.add("show");
}

function closeConfirmModal() {
  const modal = document.getElementById("confirmModal");
  modal.classList.remove("show");
  confirmCallback = null;
}

function executeConfirm() {
  if (confirmCallback) {
    confirmCallback();
    closeConfirmModal();
  }
}

// Fechar modal ao clicar fora
document.addEventListener("DOMContentLoaded", () => {
  const confirmModal = document.getElementById("confirmModal");
  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) {
        closeConfirmModal();
      }
    });
  }
  
  const confirmButton = document.getElementById("confirmModalButton");
  if (confirmButton) {
    confirmButton.addEventListener("click", executeConfirm);
  }
});

// Funções de alerta
function showAlert(message, type = "success") {
  // Remove alertas existentes
  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach((alert) => alert.remove());

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  const container = document.querySelector(".tab-content.active");
  if (container) {
    container.insertBefore(alert, container.firstChild);

    // Remove o alerta após 5 segundos
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  if (type === "error") {
    showFloatingError(message);
  }
}

function showFloatingSuccess(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast toast-success";
  const text = document.createElement("div");
  text.textContent = message;
  const close = document.createElement("button");
  close.className = "toast-close";
  close.innerHTML = "&times;";
  close.onclick = () => {
    toast.remove();
  };
  toast.appendChild(text);
  toast.appendChild(close);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

function showFloatingError(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast toast-error";
  const text = document.createElement("div");
  text.textContent = message;
  const close = document.createElement("button");
  close.className = "toast-close";
  close.innerHTML = "&times;";
  close.onclick = () => {
    toast.remove();
  };
  toast.appendChild(text);
  toast.appendChild(close);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 5000);
}

// ==================== CATEGORIAS ====================

async function loadCategories() {
  const tbody = document.querySelector("#categoriasTable tbody");
  tbody.innerHTML = "";

  try {
    const categorias = await CategoriasAPI.list();
    // Sincroniza em localStorage para outros módulos (filtros, etc.)
    if (Array.isArray(categorias)) {
      localStorage.setItem("categorias", JSON.stringify(categorias));
    }

    categorias.forEach((categoria) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${categoria.id}</td>
                <td>${categoria.nome}</td>
                <td>${categoria.descricao || "-"}</td>
                <td><span class="status-badge ${
                  categoria.ativa ? "status-ativo" : "status-inativo"
                }">
                    ${categoria.ativa ? "Ativa" : "Inativa"}
                </span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editCategory(${
                      categoria.id
                    })">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCategory(${
                      categoria.id
                    })">Excluir</button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } catch (error) {
    // Fallback para dados locais caso a API não esteja disponível
    const categorias = Storage.getAll("categorias");
    categorias.forEach((categoria) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${categoria.id}</td>
                <td>${categoria.nome}</td>
                <td>${categoria.descricao || "-"}</td>
                <td><span class="status-badge ${
                  categoria.ativa ? "status-ativo" : "status-inativo"
                }">
                    ${categoria.ativa ? "Ativa" : "Inativa"}
                </span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editCategory(${
                      categoria.id
                    })">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCategory(${
                      categoria.id
                    })">Excluir</button>
                </td>
            `;
      tbody.appendChild(row);
    });
    showAlert(
      "Não foi possível carregar categorias do servidor. Exibindo dados locais.",
      "error"
    );
  }
}

async function openCategoryModal(id = null) {
  const modal = document.getElementById("categoryModal");
  const title = document.getElementById("categoryModalTitle");
  const form = document.getElementById("categoryForm");

  form.reset();
  currentEditingId = id;
  currentEditingType = "categoria";

  if (id) {
    title.textContent = "Editar Categoria";
    let categoria = Storage.findById("categorias", id);
    try {
      // Tenta obter dados mais recentes da API
      categoria = await CategoriasAPI.getById(id);
    } catch (_) {
      // mantém dado local caso API falhe
    }
    if (categoria) {
      document.getElementById("categoryNome").value = categoria.nome;
      document.getElementById("categoryDescricao").value =
        categoria.descricao || "";
      document.getElementById("categoryAtiva").checked = categoria.ativa;
    }
  } else {
    title.textContent = "Nova Categoria";
  }

  modal.style.display = "block";
}

function closeCategoryModal() {
  document.getElementById("categoryModal").style.display = "none";
  currentEditingId = null;
  currentEditingType = null;
}

async function handleCategorySubmit(event) {
  event.preventDefault();

  const formData = {
    nome: document.getElementById("categoryNome").value.trim(),
    descricao: document.getElementById("categoryDescricao").value.trim(),
    ativa: document.getElementById("categoryAtiva").checked,
  };

  const errors = Categoria.validate(formData);
  if (errors.length > 0) {
    showAlert(errors.join(", "), "error");
    return;
  }

  try {
    if (currentEditingId) {
      await CategoriasAPI.update(currentEditingId, formData);
    } else {
      await CategoriasAPI.create(formData);
    }

    await syncCategoriasToLocalStorage();
    await syncProdutosToLocalStorage();
    closeCategoryModal();
    await loadCategories();
    loadProductFilters();
    refreshDashboard();
    showAlert(
      `Categoria ${currentEditingId ? "atualizada" : "criada"} com sucesso!`,
      "success"
    );
    showFloatingSuccess(`Categoria ${currentEditingId ? "atualizada" : "criada"} com sucesso!`);
  } catch (error) {
    // Fallback salva localmente se API falhar
    try {
      if (currentEditingId) {
        Storage.save("categorias", { ...formData, id: currentEditingId });
      } else {
        Storage.save("categorias", formData);
      }
      closeCategoryModal();
      loadCategories();
      loadProductFilters();
      refreshDashboard();
      showAlert("API indisponível. Alteração salva localmente.", "error");
    } catch (e2) {
      showAlert(
        "Erro ao salvar categoria: " + (error.message || "Erro desconhecido"),
        "error"
      );
    }
  }
}

function editCategory(id) {
  openCategoryModal(id);
}

async function deleteCategory(id) {
  const countProdutos = Storage.countRelated("produtos", "categoriaId", id);

  if (countProdutos > 0) {
    showAlert(
      `Não é possível excluir categoria com ${countProdutos} produto(s) vinculado(s)`,
      "error"
    );
    return;
  }

  showConfirmModal(
    "Excluir Categoria",
    "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.",
    async () => {
      try {
        await CategoriasAPI.remove(id);
        await syncCategoriasToLocalStorage();
        await syncProdutosToLocalStorage();
        await loadCategories();
        loadProductFilters();
        refreshDashboard();
        showAlert("Categoria excluída com sucesso!", "success");
        showFloatingSuccess("Categoria excluída com sucesso!");
      } catch (error) {
        // Fallback local
        Storage.delete("categorias", id);
        loadCategories();
        loadProductFilters();
        refreshDashboard();
        showAlert("API indisponível. Exclusão realizada localmente.", "error");
      }
    }
  );
}

// ==================== FORNECEDORES ====================

async function loadSuppliers() {
  const tbody = document.querySelector("#fornecedoresTable tbody");

  tbody.innerHTML = "";

  try {
    const fornecedores = await FornecedoresAPI.list();
    if (Array.isArray(fornecedores)) {
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
    }
    fornecedores.forEach((fornecedor) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${fornecedor.id}</td>
            <td>${fornecedor.nome}</td>
            <td>${fornecedor.email || "-"}</td>
            <td>${fornecedor.fone || "-"}</td>
            <td>${fornecedor.cnpj || "-"}</td>
            <td><span class="status-badge ${
              fornecedor.ativo ? "status-ativo" : "status-inativo"
            }">
                ${fornecedor.ativo ? "Ativo" : "Inativo"}
            </span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editSupplier(${
                  fornecedor.id
                })">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSupplier(${
                  fornecedor.id
                })">Excluir</button>
            </td>
        `;
      tbody.appendChild(row);
    });
  } catch (error) {
    const fornecedores = Storage.getAll("fornecedores");
    fornecedores.forEach((fornecedor) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${fornecedor.id}</td>
            <td>${fornecedor.nome}</td>
            <td>${fornecedor.email || "-"}</td>
            <td>${fornecedor.fone || "-"}</td>
            <td>${fornecedor.cnpj || "-"}</td>
            <td><span class="status-badge ${
              fornecedor.ativo ? "status-ativo" : "status-inativo"
            }">
                ${fornecedor.ativo ? "Ativo" : "Inativo"}
            </span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editSupplier(${
                  fornecedor.id
                })">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSupplier(${
                  fornecedor.id
                })">Excluir</button>
            </td>
        `;
      tbody.appendChild(row);
    });
    showAlert(
      "Não foi possível carregar fornecedores do servidor. Exibindo dados locais.",
      "error"
    );
  }
}

async function openSupplierModal(id = null) {
  const modal = document.getElementById("supplierModal");
  const title = document.getElementById("supplierModalTitle");
  const form = document.getElementById("supplierForm");

  form.reset();
  currentEditingId = id;
  currentEditingType = "fornecedor";

  if (id) {
    title.textContent = "Editar Fornecedor";
    let fornecedor = Storage.findById("fornecedores", id);
    try {
      fornecedor = await FornecedoresAPI.getById(id);
    } catch (_) {}
    if (fornecedor) {
      document.getElementById("supplierNome").value = fornecedor.nome;
      document.getElementById("supplierEmail").value = fornecedor.email || "";
      document.getElementById("supplierFone").value = fornecedor.fone || "";
      document.getElementById("supplierCnpj").value = fornecedor.cnpj || "";
      document.getElementById("supplierEndereco").value =
        fornecedor.endereco || "";
      document.getElementById("supplierAtivo").checked = fornecedor.ativo;
    }
  } else {
    title.textContent = "Novo Fornecedor";
  }

  modal.style.display = "block";
}

function closeSupplierModal() {
  document.getElementById("supplierModal").style.display = "none";
  currentEditingId = null;
  currentEditingType = null;
}

async function handleSupplierSubmit(event) {
  event.preventDefault();

  const formData = {
    nome: document.getElementById("supplierNome").value.trim(),
    email: document.getElementById("supplierEmail").value.trim(),
    fone: document.getElementById("supplierFone").value.trim(),
    cnpj: document.getElementById("supplierCnpj").value.trim(),
    endereco: document.getElementById("supplierEndereco").value.trim(),
    ativo: document.getElementById("supplierAtivo").checked,
  };

  // Validação
  const errors = Fornecedor.validate(formData);

  if (
    formData.email &&
    Fornecedor.checkDuplicateEmail(formData.email, currentEditingId)
  ) {
    errors.push("Já existe um fornecedor com este email");
  }

  if (
    formData.cnpj &&
    Fornecedor.checkDuplicateCnpj(formData.cnpj, currentEditingId)
  ) {
    errors.push("Já existe um fornecedor com este CNPJ");
  }

  if (errors.length > 0) {
    showAlert(errors.join(", "), "error");
    return;
  }

  try {
    if (currentEditingId) {
      await FornecedoresAPI.update(currentEditingId, formData);
    } else {
      await FornecedoresAPI.create(formData);
    }
    await syncFornecedoresToLocalStorage();
    await syncProdutosToLocalStorage();
    closeSupplierModal();
    await loadSuppliers();
    loadProductFilters(); // Atualizar filtros de produto
    refreshDashboard(); // Atualizar dashboard
    showAlert(
      `Fornecedor ${currentEditingId ? "atualizado" : "criado"} com sucesso!`,
      "success"
    );
    showFloatingSuccess(`Fornecedor ${currentEditingId ? "atualizado" : "criado"} com sucesso!`);
  } catch (error) {
    // Fallback local
    try {
      if (currentEditingId) {
        Storage.save("fornecedores", { ...formData, id: currentEditingId });
      } else {
        Storage.save("fornecedores", formData);
      }
      closeSupplierModal();
      loadSuppliers();
      loadProductFilters();
      refreshDashboard();
      showAlert("API indisponível. Alteração salva localmente.", "error");
    } catch (e2) {
      showAlert(
        "Erro ao salvar fornecedor: " + (error.message || "Erro desconhecido"),
        "error"
      );
    }
  }
}

function editSupplier(id) {
  openSupplierModal(id);
}

async function deleteSupplier(id) {
  const countProdutos = Storage.countRelated("produtos", "fornecedorId", id);

  if (countProdutos > 0) {
    showAlert(
      `Não é possível excluir fornecedor com ${countProdutos} produto(s) vinculado(s)`,
      "error"
    );
    return;
  }

  showConfirmModal(
    "Excluir Fornecedor",
    "Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.",
    async () => {
      try {
        await FornecedoresAPI.remove(id);
        await syncFornecedoresToLocalStorage();
        await syncProdutosToLocalStorage();
        await loadSuppliers();
        loadProductFilters();
        refreshDashboard();
        showAlert("Fornecedor excluído com sucesso!", "success");
        showFloatingSuccess("Fornecedor excluído com sucesso!");
      } catch (error) {
        Storage.delete("fornecedores", id);
        loadSuppliers();
        loadProductFilters();
        refreshDashboard();
        showAlert("API indisponível. Exclusão realizada localmente.", "error");
      }
    }
  );
}

// ==================== PRODUTOS ====================

async function loadProducts() {
  const tbody = document.querySelector("#produtosTable tbody");

  tbody.innerHTML = "";

  try {
    const produtos = await ProdutosAPI.list();
    // sincronizar local com mapeamento é feito em syncProdutosToLocalStorage também
    if (Array.isArray(produtos)) {
      const mapped = produtos.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        unidadeMedida: p.unidadeMedida,
        dimensoes: p.dimensoes,
        cor: p.cor,
        quantidadeMinima: p.quantidadeMinima ?? null,
        quantidadeIdeal: p.quantidadeIdeal ?? null,
        quantidadeMaxima: p.quantidadeMaxima ?? null,
        ativo: p.ativo,
        categoriaId: p.categoriaId || null,
        fornecedorId: p.fornecedorId || null,
        estoqueAtual: p.quantidadeEstoque ?? 0,
      }));
      localStorage.setItem("produtos", JSON.stringify(mapped));

      mapped.forEach((produto) => {
        const produtoObj = new Produto(produto);
        const situacaoEstoque = produtoObj.getSituacaoEstoque();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produtoObj.getCategoriaNome()}</td>
            <td>${produtoObj.getFornecedorNome()}</td>
            <td>R$ ${parseFloat(produto.preco).toFixed(2)}</td>
            <td>${produto.estoqueAtual || 0} ${produto.unidadeMedida}</td>
            <td>
                <span class="status-badge ${
                  produto.ativo ? "status-ativo" : "status-inativo"
                }">
                    ${produto.ativo ? "Ativo" : "Inativo"}
                </span>
                <br>
                <span class="status-badge ${situacaoEstoque.class}">
                    ${situacaoEstoque.label}
                </span>
            </td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editProduct(${
                  produto.id
                })">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
                  produto.id
                })">Excluir</button>
            </td>
        `;
        tbody.appendChild(row);
      });
      return;
    }
  } catch (_) {}

  // Fallback local
  const produtos = Storage.getAll("produtos");
  produtos.forEach((produto) => {
    const produtoObj = new Produto(produto);
    const situacaoEstoque = produtoObj.getSituacaoEstoque();
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produtoObj.getCategoriaNome()}</td>
            <td>${produtoObj.getFornecedorNome()}</td>
            <td>R$ ${parseFloat(produto.preco).toFixed(2)}</td>
            <td>${produto.estoqueAtual || 0} ${produto.unidadeMedida}</td>
            <td>
                <span class="status-badge ${
                  produto.ativo ? "status-ativo" : "status-inativo"
                }">
                    ${produto.ativo ? "Ativo" : "Inativo"}
                </span>
                <br>
                <span class="status-badge ${situacaoEstoque.class}">
                    ${situacaoEstoque.label}
                </span>
            </td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editProduct(${
                  produto.id
                })">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
                  produto.id
                })">Excluir</button>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function loadProductFilters() {
  // Carregar categorias no filtro
  const categorias = Storage.getAll("categorias").filter((c) => c.ativa);
  const categoriaSelect = document.getElementById("filterProdutoCategoria");
  const productCategoriaSelect = document.getElementById("productCategoria");

  if (categoriaSelect) {
    categoriaSelect.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach((categoria) => {
      const option = new Option(categoria.nome, categoria.id);
      categoriaSelect.appendChild(option);
    });
  }

  if (productCategoriaSelect) {
    productCategoriaSelect.innerHTML =
      '<option value="">Selecione uma categoria</option>';
    categorias.forEach((categoria) => {
      const option = new Option(categoria.nome, categoria.id);
      productCategoriaSelect.appendChild(option);
    });
  }

  // Carregar fornecedores no filtro
  const fornecedores = Storage.getAll("fornecedores").filter((f) => f.ativo);
  const fornecedorSelect = document.getElementById("filterProdutoFornecedor");
  const productFornecedorSelect = document.getElementById("productFornecedor");

  if (fornecedorSelect) {
    fornecedorSelect.innerHTML =
      '<option value="">Todos os fornecedores</option>';
    fornecedores.forEach((fornecedor) => {
      const option = new Option(fornecedor.nome, fornecedor.id);
      fornecedorSelect.appendChild(option);
    });
  }

  if (productFornecedorSelect) {
    productFornecedorSelect.innerHTML =
      '<option value="">Selecione um fornecedor</option>';
    fornecedores.forEach((fornecedor) => {
      const option = new Option(fornecedor.nome, fornecedor.id);
      productFornecedorSelect.appendChild(option);
    });
  }
}

function filterProducts() {
  const nomeFilter = document
    .getElementById("filterProdutoNome")
    .value.toLowerCase();
  const categoriaFilter = document.getElementById(
    "filterProdutoCategoria"
  ).value;
  const fornecedorFilter = document.getElementById(
    "filterProdutoFornecedor"
  ).value;

  const rows = document.querySelectorAll("#produtosTable tbody tr");

  rows.forEach((row) => {
    const nome = row.cells[1].textContent.toLowerCase();
    const categoria = row.cells[2].textContent;
    const fornecedor = row.cells[3].textContent;

    let show = true;

    if (nomeFilter && !nome.includes(nomeFilter)) {
      show = false;
    }

    if (categoriaFilter) {
      const categoriaObj = Storage.findById("categorias", categoriaFilter);
      if (!categoriaObj || categoria !== categoriaObj.nome) {
        show = false;
      }
    }

    if (fornecedorFilter) {
      const fornecedorObj = Storage.findById("fornecedores", fornecedorFilter);
      if (!fornecedorObj || fornecedor !== fornecedorObj.nome) {
        show = false;
      }
    }

    row.style.display = show ? "" : "none";
  });
}

async function openProductModal(id = null) {
  const modal = document.getElementById("productModal");
  const title = document.getElementById("productModalTitle");
  const form = document.getElementById("productForm");

  form.reset();
  currentEditingId = id;
  currentEditingType = "produto";

  loadProductFilters();

  if (id) {
    title.textContent = "Editar Produto";
    let produto = Storage.findById("produtos", id);
    try {
      let apiProduto = await ProdutosAPI.getById(id);
      if (apiProduto) {
        const merged = {
          ...produto,
          ...apiProduto,
        };
        if (apiProduto.quantidadeEstoque !== undefined) {
          merged.estoqueAtual = apiProduto.quantidadeEstoque;
        }
        // preservar ids locais se não vierem no DTO
        if (
          !apiProduto.categoriaId &&
          merged.categoriaId == null &&
          apiProduto.categoriaNome
        ) {
          const categorias = JSON.parse(
            localStorage.getItem("categorias") || "[]"
          );
          const cat = categorias.find(
            (c) => c.nome === apiProduto.categoriaNome
          );
          if (cat) merged.categoriaId = cat.id;
        }
        if (
          !apiProduto.fornecedorId &&
          merged.fornecedorId == null &&
          apiProduto.fornecedorNome
        ) {
          const fornecedores = JSON.parse(
            localStorage.getItem("fornecedores") || "[]"
          );
          const forn = fornecedores.find(
            (f) => f.nome === apiProduto.fornecedorNome
          );
          if (forn) merged.fornecedorId = forn.id;
        }
        produto = merged;
      }
    } catch (_) {}
    if (produto) {
      document.getElementById("productCodigo").value = produto.codigo;
      document.getElementById("productNome").value = produto.nome;
      document.getElementById("productDescricao").value =
        produto.descricao || "";
      document.getElementById("productPreco").value = produto.preco;
      document.getElementById("productUnidadeMedida").value =
        produto.unidadeMedida;
      document.getElementById("productDimensoes").value =
        produto.dimensoes || "";
      document.getElementById("productCor").value = produto.cor || "";
      document.getElementById("productQtdMinima").value =
        produto.quantidadeMinima || "";
      document.getElementById("productQtdIdeal").value =
        produto.quantidadeIdeal || "";
      document.getElementById("productQtdMaxima").value =
        produto.quantidadeMaxima || "";
      document.getElementById("productCategoria").value = produto.categoriaId;
      document.getElementById("productFornecedor").value = produto.fornecedorId;
      document.getElementById("productAtivo").checked = produto.ativo;
    }
  } else {
    title.textContent = "Novo Produto";
  }

  modal.style.display = "block";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
  currentEditingId = null;
  currentEditingType = null;
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const formData = {
    codigo: document.getElementById("productCodigo").value.trim(),
    nome: document.getElementById("productNome").value.trim(),
    descricao: document.getElementById("productDescricao").value.trim(),
    preco: parseFloat(document.getElementById("productPreco").value),
    unidadeMedida: document.getElementById("productUnidadeMedida").value.trim(),
    dimensoes: document.getElementById("productDimensoes").value.trim(),
    cor: document.getElementById("productCor").value.trim(),
    quantidadeMinima:
      parseInt(document.getElementById("productQtdMinima").value) || 0,
    quantidadeIdeal:
      parseInt(document.getElementById("productQtdIdeal").value) || 0,
    quantidadeMaxima:
      parseInt(document.getElementById("productQtdMaxima").value) || 0,
    categoriaId: parseInt(document.getElementById("productCategoria").value),
    fornecedorId: parseInt(document.getElementById("productFornecedor").value),
    ativo: document.getElementById("productAtivo").checked,
  };

  const errors = Produto.validate({
    ...formData,
    quantidadeMinima: formData.quantidadeMinima || null,
    quantidadeIdeal: formData.quantidadeIdeal || null,
    quantidadeMaxima: formData.quantidadeMaxima || null,
  });

  if (Produto.checkDuplicateCodigo(formData.codigo, currentEditingId)) {
    errors.push("Já existe um produto com este código");
  }

  if (
    Produto.checkDuplicateNameAndCategory(
      formData.nome,
      formData.categoriaId,
      currentEditingId
    )
  ) {
    errors.push("Já existe um produto com este nome para a mesma categoria");
  }

  if (errors.length > 0) {
    showAlert(errors.join(", "), "error");
    return;
  }

  try {
    if (currentEditingId) {
      await ProdutosAPI.update(currentEditingId, formData);
    } else {
      await ProdutosAPI.create(formData);
    }

    await syncProdutosToLocalStorage();
    closeProductModal();
    await loadProducts();
    loadEstoqueSelects();
    refreshDashboard();
    showAlert(
      `Produto ${currentEditingId ? "atualizado" : "criado"} com sucesso!`,
      "success"
    );
    showFloatingSuccess(`Produto ${currentEditingId ? "atualizado" : "criado"} com sucesso!`);
  } catch (error) {
    // Fallback local
    try {
      if (currentEditingId) {
        const produtoExistente = Storage.findById("produtos", currentEditingId);
        const fallback = { ...formData, id: currentEditingId };
        if (produtoExistente)
          fallback.estoqueAtual = produtoExistente.estoqueAtual;
        Storage.save("produtos", fallback);
      } else {
        Storage.save("produtos", { ...formData, estoqueAtual: 0 });
      }
      closeProductModal();
      loadProducts();
      loadEstoqueSelects();
      refreshDashboard();
      showAlert("API indisponível. Alteração salva localmente.", "error");
    } catch (e2) {
      showAlert(
        "Erro ao salvar produto: " + (error.message || "Erro desconhecido"),
        "error"
      );
    }
  }
}

function editProduct(id) {
  openProductModal(id);
}

async function deleteProduct(id) {
  showConfirmModal(
    "Excluir Produto",
    "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.",
    async () => {
      try {
        await ProdutosAPI.remove(id);
        await syncProdutosToLocalStorage();
        await loadProducts();
        loadEstoqueSelects();
        refreshDashboard();
        showAlert("Produto excluído com sucesso!", "success");
        showFloatingSuccess("Produto excluído com sucesso!");
      } catch (error) {
        Storage.delete("produtos", id);
        loadProducts();
        loadEstoqueSelects();
        refreshDashboard();
        showAlert("API indisponível. Exclusão realizada localmente.", "error");
      }
    }
  );
}

// ==================== ESTOQUE ====================

function loadEstoqueSelects() {
  const produtos = Storage.getAll("produtos").filter((p) => p.ativo);

  const selects = ["produtoEntrada", "produtoSaida", "produtoHistorico"];

  selects.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;

    select.innerHTML =
      selectId === "produtoHistorico"
        ? '<option value="">Selecione um produto para ver o histórico</option>'
        : '<option value="">Selecione um produto</option>';

    produtos.forEach((produto) => {
      const option = new Option(
        `${produto.codigo} - ${produto.nome}`,
        produto.id
      );
      select.appendChild(option);
    });

    // Restaurar valor selecionado se existir
    if (currentValue) {
      select.value = currentValue;
    }
  });

  // Atualizar saldos exibidos
  updateSaldoInfo("produtoEntrada", "saldoEntradaInfo");
  updateSaldoInfo("produtoSaida", "saldoSaidaInfo");
}

function updateSaldoInfo(selectId, infoElementId) {
  const select = document.getElementById(selectId);
  const info = document.getElementById(infoElementId);
  if (!select || !info) return;
  const produtoId = select.value;
  if (!produtoId) {
    info.textContent = "Saldo: -";
    return;
  }
  const produto = Storage.findById("produtos", produtoId);
  if (!produto) {
    info.textContent = "Saldo: -";
    return;
  }
  const unidade = produto.unidadeMedida || "";
  info.textContent = `Saldo: ${produto.estoqueAtual || 0} ${unidade}`;
}

async function entradaEstoque() {
  const produtoId = document.getElementById("produtoEntrada").value;
  const quantidade = Math.floor(
    parseInt(document.getElementById("quantidadeEntrada").value)
  );
  const usuario = document.getElementById("usuarioEntrada").value.trim();
  const observacao = (
    document.getElementById("observacaoEntrada")?.value || ""
  ).trim();

  if (!produtoId) {
    showAlert("Selecione um produto", "error");
    return;
  }

  if (!quantidade || quantidade <= 0) {
    showAlert("Informe uma quantidade válida", "error");
    return;
  }

  if (!usuario) {
    showAlert("Informe o usuário responsável", "error");
    return;
  }

  try {
    await ProdutosAPI.repor(produtoId, quantidade, usuario);
    await syncProdutosToLocalStorage();

    // Registrar movimentação local para alimentar gráficos
    const prod = Storage.findById("produtos", produtoId);
    if (prod) {
      const quantidadeAtual = prod.estoqueAtual || 0;
      const quantidadeAnterior = quantidadeAtual - quantidade;
      Storage.saveMovimentacao({
        produtoId: parseInt(produtoId),
        tipo: "ENTRADA",
        quantidade: quantidade,
        quantidadeAnterior: quantidadeAnterior,
        quantidadeAtual: quantidadeAtual,
        usuario: usuario,
        observacao: observacao || "Reposição de estoque",
      });
    }

    document.getElementById("quantidadeEntrada").value = "";
    document.getElementById("usuarioEntrada").value =
      document.getElementById("usuarioEntrada").value || "lubcarv";
    if (document.getElementById("observacaoEntrada"))
      document.getElementById("observacaoEntrada").value = "";

    await loadProducts();
    updateSaldoInfo("produtoEntrada", "saldoEntradaInfo");
    refreshDashboard();
      showAlert(
        `Entrada de ${quantidade} unidades registrada com sucesso!`,
        "success"
      );
      showFloatingSuccess(`Entrada de ${quantidade} unidades registrada com sucesso!`);

    const produtoHistorico = document.getElementById("produtoHistorico").value;
    if (produtoHistorico === produtoId) {
      await loadMovimentacoes();
    }
  } catch (error) {
    // Fallback local
    try {
      MovimentacaoEstoque.registrarEntrada(
        produtoId,
        quantidade,
        usuario,
        observacao || "Entrada de estoque"
      );
      document.getElementById("quantidadeEntrada").value = "";
      document.getElementById("usuarioEntrada").value =
        document.getElementById("usuarioEntrada").value || "lubcarv";
      if (document.getElementById("observacaoEntrada"))
        document.getElementById("observacaoEntrada").value = "";
      loadProducts();
      updateSaldoInfo("produtoEntrada", "saldoEntradaInfo");
      refreshDashboard();
      showAlert("API indisponível. Entrada registrada localmente.", "error");
    } catch (e2) {
      showAlert(
        "Erro ao registrar entrada: " + (error.message || "Erro desconhecido"),
        "error"
      );
    }
  }
}

async function saidaEstoque() {
  const produtoId = document.getElementById("produtoSaida").value;
  const quantidade = Math.floor(
    parseInt(document.getElementById("quantidadeSaida").value)
  );
  const usuario = document.getElementById("usuarioSaida").value.trim();
  const observacao = (
    document.getElementById("observacaoSaida")?.value || ""
  ).trim();

  if (!produtoId) {
    showAlert("Selecione um produto", "error");
    return;
  }

  if (!quantidade || quantidade <= 0) {
    showAlert("Informe uma quantidade válida", "error");
    return;
  }

  if (!usuario) {
    showAlert("Informe o usuário responsável", "error");
    return;
  }

  // Validação rápida de estoque disponível (evitar ida desnecessária ao servidor)
  const prodLocal = Storage.findById("produtos", produtoId);
  if (prodLocal && (prodLocal.estoqueAtual || 0) < quantidade) {
    showAlert(
      `Estoque insuficiente. Disponível: ${
        prodLocal.estoqueAtual || 0
      }, Solicitado: ${quantidade}`,
      "error"
    );
    return;
  }

  try {
    await ProdutosAPI.retirar(produtoId, quantidade, usuario);
    await syncProdutosToLocalStorage();

    // Registrar movimentação local para alimentar gráficos
    const prod = Storage.findById("produtos", produtoId);
    if (prod) {
      const quantidadeAtual = prod.estoqueAtual || 0;
      const quantidadeAnterior = quantidadeAtual + quantidade;
      Storage.saveMovimentacao({
        produtoId: parseInt(produtoId),
        tipo: "SAIDA",
        quantidade: quantidade,
        quantidadeAnterior: quantidadeAnterior,
        quantidadeAtual: quantidadeAtual,
        usuario: usuario,
        observacao: observacao || "Saída de estoque",
      });
    }

    document.getElementById("quantidadeSaida").value = "";
    document.getElementById("usuarioSaida").value =
      document.getElementById("usuarioSaida").value || "lubcarv";
    if (document.getElementById("observacaoSaida"))
      document.getElementById("observacaoSaida").value = "";

    await loadProducts();
    updateSaldoInfo("produtoSaida", "saldoSaidaInfo");
    refreshDashboard();
      showAlert(
        `Saída de ${quantidade} unidades registrada com sucesso!`,
        "success"
      );
      showFloatingSuccess(`Saída de ${quantidade} unidades registrada com sucesso!`);

    const produtoHistorico = document.getElementById("produtoHistorico").value;
    if (produtoHistorico === produtoId) {
      await loadMovimentacoes();
    }
  } catch (error) {
    // Fallback local
    try {
      MovimentacaoEstoque.registrarSaida(
        produtoId,
        quantidade,
        usuario,
        observacao || "Saída de estoque"
      );
      document.getElementById("quantidadeSaida").value = "";
      document.getElementById("usuarioSaida").value =
        document.getElementById("usuarioSaida").value || "lubcarv";
      if (document.getElementById("observacaoSaida"))
        document.getElementById("observacaoSaida").value = "";
      loadProducts();
      updateSaldoInfo("produtoSaida", "saldoSaidaInfo");
      refreshDashboard();
      showAlert("API indisponível. Saída registrada localmente.", "error");
    } catch (e2) {
      showAlert(
        "Erro ao registrar saída: " + (error.message || "Erro desconhecido"),
        "error"
      );
    }
  }
}

async function loadMovimentacoes() {
  const produtoId = document.getElementById("produtoHistorico").value;
  const tbody = document.querySelector("#movimentacoesTable tbody");

  if (!produtoId) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center;">Selecione um produto para ver o histórico</td></tr>';
    return;
  }

  tbody.innerHTML = "";

  try {
    const historico = await ProdutosAPI.historico(produtoId);
    if (!Array.isArray(historico) || historico.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align: center;">Nenhuma movimentação encontrada</td></tr>';
      return;
    }
    historico.forEach((mov) => {
      const dataHora = mov.dataMovimentacao
        ? new Date(mov.dataMovimentacao).toLocaleString("pt-BR")
        : "-";
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${dataHora}</td>
            <td>${mov.produtoCodigo || "-"}</td>
            <td>${mov.produtoNome || "-"}</td>
            <td><span class="status-badge ${
              mov.tipo === "ENTRADA" ? "status-ativo" : "status-inativo"
            }">
                ${mov.tipo}
            </span></td>
            <td>${mov.quantidade}</td>
            <td>${mov.usuario || "-"}</td>
            <td>${mov.observacao || "-"}</td>
            <td>-</td>
        `;
      tbody.appendChild(row);
    });
    return;
  } catch (_) {}

  // Fallback local
  const movimentacoes = Storage.getMovimentacoesByProduto(produtoId);
  if (movimentacoes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center;">Nenhuma movimentação encontrada</td></tr>';
    return;
  }
  const produtoLocal = Storage.findById("produtos", produtoId);
  movimentacoes.forEach((mov) => {
    const movObj = new MovimentacaoEstoque(mov);
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${movObj.getDataHoraFormatada()}</td>
            <td>${produtoLocal ? produtoLocal.codigo : "-"}</td>
            <td>${produtoLocal ? produtoLocal.nome : "-"}</td>
            <td><span class="status-badge ${
              mov.tipo === "ENTRADA" ? "status-ativo" : "status-inativo"
            }">
                ${mov.tipo}
            </span></td>
            <td>${mov.quantidade}</td>
            <td>${mov.usuario}</td>
            <td>${mov.observacao}</td>
            <td>${mov.quantidadeAtual}</td>
        `;
    tbody.appendChild(row);
  });
}

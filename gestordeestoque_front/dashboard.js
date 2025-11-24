let charts = {};

function initializeDashboard() {
  loadKPIs();
  loadCharts();
  loadProdutosBaixoEstoque();
}

// Carregar KPIs
function loadKPIs() {
  const produtos = Storage.getAll("produtos");
  const categorias = Storage.getAll("categorias").filter((c) => c.ativa);
  const fornecedores = Storage.getAll("fornecedores").filter((f) => f.ativo);

  // Produtos com estoque baixo
  const produtosBaixoEstoque = produtos.filter((produto) => {
    if (!produto.quantidadeMinima) return false;
    return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
  });

  document.getElementById("totalProdutos").textContent = produtos.length;
  document.getElementById("totalCategorias").textContent = categorias.length;
  document.getElementById("totalFornecedores").textContent =
    fornecedores.length;
  document.getElementById("produtosBaixoEstoque").textContent =
    produtosBaixoEstoque.length;
}

// Carregar todos os gráficos
function loadCharts() {
  loadTopSaidasChart();
  loadMenosSaidasChart();
  loadCategoriasChart();
  loadEstoqueStatusChart();
  loadMovimentacoesChart();
}

// Gráfico: Top 10 Produtos com Maior Saída
function loadTopSaidasChart() {
  const ctx = document.getElementById("topSaidasChart").getContext("2d");

  // Calcular saídas por produto
  const movimentacoes = Storage.getAll("movimentacoes");
  const saidasPorProduto = {};

  movimentacoes
    .filter((m) => m.tipo === "SAIDA")
    .forEach((mov) => {
      if (!saidasPorProduto[mov.produtoId]) {
        saidasPorProduto[mov.produtoId] = 0;
      }
      saidasPorProduto[mov.produtoId] += mov.quantidade;
    });

  // Obter top 10
  const produtos = Storage.getAll("produtos");
  const topSaidas = Object.entries(saidasPorProduto)
    .map(([produtoId, quantidade]) => {
      const produto = produtos.find((p) => p.id === parseInt(produtoId));
      return {
        nome: produto ? produto.nome : "Produto não encontrado",
        quantidade: quantidade,
      };
    })
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  if (charts.topSaidas) {
    charts.topSaidas.destroy();
  }

  charts.topSaidas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: topSaidas.map((item) => item.nome),
      datasets: [
        {
          label: "Quantidade Saída",
          data: topSaidas.map((item) => item.quantidade),
          backgroundColor: "rgba(231, 76, 60, 0.8)",
          borderColor: "rgba(231, 76, 60, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
}

// Gráfico: Top 10 Produtos com Menor Saída
function loadMenosSaidasChart() {
  const ctx = document.getElementById("menosSaidasChart").getContext("2d");
  const movimentacoes = Storage.getAll("movimentacoes");
  const saidasPorProduto = {};

  movimentacoes
    .filter((m) => m.tipo === "SAIDA")
    .forEach((mov) => {
      if (!saidasPorProduto[mov.produtoId]) {
        saidasPorProduto[mov.produtoId] = 0;
      }
      saidasPorProduto[mov.produtoId] += mov.quantidade;
    });

  const produtos = Storage.getAll("produtos");
  const lista = Object.entries(saidasPorProduto)
    .map(([produtoId, quantidade]) => {
      const produto = produtos.find((p) => p.id === parseInt(produtoId));
      return {
        nome: produto ? produto.nome : "Produto não encontrado",
        quantidade: quantidade,
      };
    })
    .sort((a, b) => a.quantidade - b.quantidade)
    .slice(0, 10);

  if (charts.menosSaidas) {
    charts.menosSaidas.destroy();
  }

  charts.menosSaidas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: lista.map((item) => item.nome),
      datasets: [
        {
          label: "Quantidade Saída",
          data: lista.map((item) => item.quantidade),
          backgroundColor: "rgba(52, 152, 219, 0.8)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { ticks: { maxRotation: 45, minRotation: 45 } },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", carregarCategorias);

// Gráfico: Distribuição por Categorias
function loadCategoriasChart() {
  const ctx = document.getElementById("categoriasChart").getContext("2d");

  const produtos = Storage.getAll("produtos");
  const categorias = Storage.getAll("categorias");

  const produtosPorCategoria = {};

  produtos.forEach((produto) => {
    const categoria = categorias.find((c) => c.id === produto.categoriaId);
    const nomeCategoria = categoria ? categoria.nome : "Sem categoria";

    if (!produtosPorCategoria[nomeCategoria]) {
      produtosPorCategoria[nomeCategoria] = 0;
    }
    produtosPorCategoria[nomeCategoria]++;
  });

  const cores = [
    "rgba(52, 152, 219, 0.8)",
    "rgba(46, 204, 113, 0.8)",
    "rgba(155, 89, 182, 0.8)",
    "rgba(241, 196, 15, 0.8)",
    "rgba(230, 126, 34, 0.8)",
    "rgba(231, 76, 60, 0.8)",
    "rgba(149, 165, 166, 0.8)",
    "rgba(52, 73, 94, 0.8)",
  ];

  if (charts.categorias) {
    charts.categorias.destroy();
  }

  charts.categorias = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(produtosPorCategoria),
      datasets: [
        {
          data: Object.values(produtosPorCategoria),
          backgroundColor: cores,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Gráfico: Status do Estoque
function loadEstoqueStatusChart() {
  const ctx = document.getElementById("estoqueStatusChart").getContext("2d");

  const produtos = Storage.getAll("produtos");
  let semEstoque = 0;
  let estoqueBaixo = 0;
  let estoqueOk = 0;

  produtos.forEach((produto) => {
    const produtoObj = new Produto(produto);
    const situacao = produtoObj.getSituacaoEstoque();

    switch (situacao.status) {
      case "SEM_ESTOQUE":
        semEstoque++;
        break;
      case "BAIXO":
        estoqueBaixo++;
        break;
      case "OK":
        estoqueOk++;
        break;
    }
  });

  if (charts.estoqueStatus) {
    charts.estoqueStatus.destroy();
  }

  charts.estoqueStatus = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Sem Estoque", "Estoque Baixo", "Estoque OK"],
      datasets: [
        {
          data: [semEstoque, estoqueBaixo, estoqueOk],
          backgroundColor: [
            "rgba(231, 76, 60, 0.8)",
            "rgba(243, 156, 18, 0.8)",
            "rgba(46, 204, 113, 0.8)",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Gráfico: Movimentações dos Últimos 7 Dias
function loadMovimentacoesChart() {
  const ctx = document.getElementById("movimentacoesChart").getContext("2d");

  const movimentacoes = Storage.getAll("movimentacoes");
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Criar array dos últimos 7 dias
  const dias = [];
  const entradas = [];
  const saidas = [];

  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
    const dataStr = data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    dias.push(dataStr);

    // Calcular entradas e saídas do dia
    const movimentacoesDoDia = movimentacoes.filter((mov) => {
      const movData = new Date(mov.dataHora);
      return movData.toDateString() === data.toDateString();
    });

    const entradasDoDia = movimentacoesDoDia
      .filter((mov) => mov.tipo === "ENTRADA")
      .reduce((total, mov) => total + mov.quantidade, 0);

    const saidasDoDia = movimentacoesDoDia
      .filter((mov) => mov.tipo === "SAIDA")
      .reduce((total, mov) => total + mov.quantidade, 0);

    entradas.push(entradasDoDia);
    saidas.push(saidasDoDia);
  }

  if (charts.movimentacoes) {
    charts.movimentacoes.destroy();
  }

  charts.movimentacoes = new Chart(ctx, {
    type: "line",
    data: {
      labels: dias,
      datasets: [
        {
          label: "Entradas",
          data: entradas,
          borderColor: "rgba(46, 204, 113, 1)",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Saídas",
          data: saidas,
          borderColor: "rgba(231, 76, 60, 1)",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

// Carregar produtos com estoque baixo
function loadProdutosBaixoEstoque() {
  const produtos = Storage.getAll("produtos");
  const produtosBaixoEstoque = produtos.filter((produto) => {
    if (!produto.quantidadeMinima) return false;
    return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
  });

  const tbody = document.querySelector("#produtosBaixoEstoqueTable tbody");
  tbody.innerHTML = "";

  if (produtosBaixoEstoque.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">Nenhum produto com estoque baixo</td></tr>';
    return;
  }

  produtosBaixoEstoque.forEach((produto) => {
    const produtoObj = new Produto(produto);
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produto.estoqueAtual || 0}</td>
            <td>${produto.quantidadeMinima}</td>
            <td>${produtoObj.getCategoriaNome()}</td>
            <td>${produtoObj.getFornecedorNome()}</td>
        `;
    tbody.appendChild(row);
  });
}

// Atualizar dashboard
function refreshDashboard() {
  loadKPIs();
  loadCharts();
  loadProdutosBaixoEstoque();
  showAlert("Dashboard atualizado com sucesso!", "success");
}

// Inicializar dashboard quando a aba for ativada
function loadTabData(tab) {
  switch (tab) {
    case "dashboard":
      initializeDashboard();
      break;
    case "produtos":
      loadProducts();
      loadProductFilters();
      break;
    case "categorias":
      loadCategories();
      break;
    case "fornecedores":
      loadSuppliers();
      break;
    case "estoque":
      loadEstoqueSelects();
      break;
    case "relatorios":
      loadReportsFilters();
      break;
  }
}

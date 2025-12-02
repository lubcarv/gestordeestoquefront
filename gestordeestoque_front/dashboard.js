let charts = {};

let dashboardLoading = false;

function initializeDashboard() {
  loadKPIsFromAPI();
  loadChartsFromAPI();
  loadProdutosBaixoEstoque();
}


async function loadKPIsFromAPI() {
  try {
    dashboardLoading = true;
    showLoadingIndicator(true);

    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();

    const kpis = await DashboardAPI.getKPIs(mes, ano);

    if (kpis) {
      document.getElementById("totalProdutos").textContent = kpis.produtosAtivos || 0;
      document.getElementById("totalCategorias").textContent = "0"; // Backend não retorna
      document.getElementById("totalFornecedores").textContent = "0"; // Backend não retorna
      document.getElementById("produtosBaixoEstoque").textContent = kpis.produtosEstoqueBaixo || 0;

      // Adicionar informações extras do backend
      const kpisExtras = document.getElementById("kpisExtras");
      if (kpisExtras) {
        kpisExtras.innerHTML = `
          <div class="kpi-card">
            <h4>Valor Total Estoque</h4>
            <p>R$ ${(kpis.valorTotalEstoque || 0).toFixed(2)}</p>
          </div>
          <div class="kpi-card">
            <h4>Taxa de Giro</h4>
            <p>${(kpis.taxaGiroEstoque || 0).toFixed(2)}</p>
          </div>
          <div class="kpi-card">
            <h4>Movimentações (Mês)</h4>
            <p>${kpis.totalMovimentacoesMes || 0}</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.warn("Erro ao carregar KPIs da API, usando dados locais:", error);
    loadKPIsLocal();
  } finally {
    dashboardLoading = false;
    showLoadingIndicator(false);
  }
}

// Fallback: Carregar KPIs do localStorage
function loadKPIsLocal() {
  const produtos = Storage.getAll("produtos");
  const categorias = Storage.getAll("categorias"). filter((c) => c. ativa);
  const fornecedores = Storage.getAll("fornecedores").filter((f) => f.ativo);

  const produtosBaixoEstoque = produtos. filter((produto) => {
    if (!produto.quantidadeMinima) return false;
    return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
  });

  document.getElementById("totalProdutos"). textContent = produtos.length;
  document.getElementById("totalCategorias").textContent = categorias.length;
  document.getElementById("totalFornecedores").textContent = fornecedores.length;
  document.getElementById("produtosBaixoEstoque").textContent = produtosBaixoEstoque.length;
}

async function loadChartsFromAPI() {
  try {
    dashboardLoading = true;
    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();

    const [topVendidos, menosVendidos, movimentacoes] = await Promise.all([
      DashboardAPI.getTopVendidos(mes, ano, 10). catch(() => null),
      DashboardAPI. getMenosVendidos(mes, ano, 10).catch(() => null),
      DashboardAPI.getMovimentacoesPeriodo(mes, ano). catch(() => null),
    ]);
    if (topVendidos && topVendidos.length > 0) {
      loadTopSaidasChartFromAPI(topVendidos);
    } else {
      loadTopSaidasChart();
    }

    if (menosVendidos && menosVendidos.length > 0) {
      loadMenosSaidasChartFromAPI(menosVendidos);
    } else {
      loadMenosSaidasChart();
    }

    loadCategoriasChart();
    loadEstoqueStatusChart();

    if (movimentacoes && movimentacoes.labels) {
      loadMovimentacoesChartFromAPI(movimentacoes);
    } else {
      loadMovimentacoesChart();
    }
  } catch (error) {
    console.warn("Erro ao carregar gráficos da API, usando dados locais:", error);
    loadChartsLocal();
  } finally {
    dashboardLoading = false;
  }
}

// Carregar todos os gráficos (fallback)
function loadChartsLocal() {
  loadTopSaidasChart();
  loadMenosSaidasChart();
  loadCategoriasChart();
  loadEstoqueStatusChart();
  loadMovimentacoesChart();
}

// ==================== TOP SAÍDAS (API) ====================
function loadTopSaidasChartFromAPI(dados) {
  const ctx = document.getElementById("topSaidasChart");
  if (!ctx) return;

  const topSaidas = dados.map((item) => ({
    nome: item.nomeProduto || "N/A",
    quantidade: item.quantidade || 0,
  }));

  if (charts. topSaidas) {
    charts.topSaidas.destroy();
  }

  charts. topSaidas = new Chart(ctx. getContext("2d"), {
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

// Gráfico: Top 10 Produtos com Maior Saída (Fallback Local)
function loadTopSaidasChart() {
  const ctx = document.getElementById("topSaidasChart");
  if (!ctx) return;

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
    charts.topSaidas. destroy();
  }

  charts.topSaidas = new Chart(ctx.getContext("2d"), {
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

function loadMenosSaidasChartFromAPI(dados) {
  const ctx = document.getElementById("menosSaidasChart");
  if (!ctx) return;

  const menosSaidas = dados.map((item) => ({
    nome: item.nomeProduto || "N/A",
    quantidade: item.quantidade || 0,
  }));

  if (charts.menosSaidas) {
    charts.menosSaidas.destroy();
  }

  charts. menosSaidas = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: menosSaidas. map((item) => item.nome),
      datasets: [
        {
          label: "Quantidade Saída",
          data: menosSaidas.map((item) => item.quantidade),
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

function loadMenosSaidasChart() {
  const ctx = document.getElementById("menosSaidasChart");
  if (!ctx) return;

  const movimentacoes = Storage.getAll("movimentacoes");
  const saidasPorProduto = {};

  movimentacoes
    .filter((m) => m.tipo === "SAIDA")
    .forEach((mov) => {
      if (! saidasPorProduto[mov.produtoId]) {
        saidasPorProduto[mov.produtoId] = 0;
      }
      saidasPorProduto[mov.produtoId] += mov.quantidade;
    });

  const produtos = Storage. getAll("produtos");
  const lista = Object.entries(saidasPorProduto)
    .map(([produtoId, quantidade]) => {
      const produto = produtos.find((p) => p.id === parseInt(produtoId));
      return {
        nome: produto ? produto.nome : "Produto não encontrado",
        quantidade: quantidade,
      };
    })
    .sort((a, b) => a.quantidade - b.quantidade)
    . slice(0, 10);

  if (charts.menosSaidas) {
    charts. menosSaidas.destroy();
  }

  charts.menosSaidas = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: lista.map((item) => item.nome),
      datasets: [
        {
          label: "Quantidade Saída",
          data: lista.map((item) => item.quantidade),
          backgroundColor: "rgba(52, 152, 219, 0. 8)",
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

function loadCategoriasChart() {
  const ctx = document.getElementById("categoriasChart");
  if (! ctx) return;

  const produtos = Storage.getAll("produtos");
  const categorias = Storage.getAll("categorias");

  const produtosPorCategoria = {};

  produtos.forEach((produto) => {
    const categoria = categorias.find((c) => c. id === produto.categoriaId);
    const nomeCategoria = categoria ? categoria. nome : "Sem categoria";

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

  charts.categorias = new Chart(ctx.getContext("2d"), {
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

function loadEstoqueStatusChart() {
  const ctx = document.getElementById("estoqueStatusChart");
  if (!ctx) return;

  const produtos = Storage.getAll("produtos");
  let semEstoque = 0;
  let estoqueBaixo = 0;
  let estoqueOk = 0;

  produtos.forEach((produto) => {
    const produtoObj = new Produto(produto);
    const situacao = produtoObj.getSituacaoEstoque();

    switch (situacao. status) {
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

  charts.estoqueStatus = new Chart(ctx.getContext("2d"), {
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

function loadMovimentacoesChartFromAPI(dados) {
  const ctx = document.getElementById("movimentacoesChart");
  if (! ctx) return;

  if (charts.movimentacoes) {
    charts.movimentacoes. destroy();
  }

  charts.movimentacoes = new Chart(ctx.getContext("2d"), {
    type: "line",
    data: {
      labels: dados.labels || [],
      datasets: [
        {
          label: "Entradas",
          data: dados. entradas || [],
          borderColor: "rgba(46, 204, 113, 1)",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Saídas",
          data: dados.saidas || [],
          borderColor: "rgba(231, 76, 60, 1)",
          backgroundColor: "rgba(231, 76, 60, 0. 1)",
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

function loadMovimentacoesChart() {
  const ctx = document.getElementById("movimentacoesChart");
  if (!ctx) return;

  const movimentacoes = Storage.getAll("movimentacoes");
  const hoje = new Date();

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

    const movimentacoesDoDia = movimentacoes.filter((mov) => {
      const movData = new Date(mov.dataHora);
      return movData. toDateString() === data.toDateString();
    });

    const entradasDoDia = movimentacoesDoDia
      .filter((mov) => mov.tipo === "ENTRADA")
      .reduce((total, mov) => total + mov. quantidade, 0);

    const saidasDoDia = movimentacoesDoDia
      .filter((mov) => mov.tipo === "SAIDA")
      . reduce((total, mov) => total + mov.quantidade, 0);

    entradas.push(entradasDoDia);
    saidas.push(saidasDoDia);
  }

  if (charts.movimentacoes) {
    charts.movimentacoes.destroy();
  }

  charts.movimentacoes = new Chart(ctx.getContext("2d"), {
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

function loadProdutosBaixoEstoque() {
  const produtos = Storage.getAll("produtos");
  const produtosBaixoEstoque = produtos.filter((produto) => {
    if (! produto.quantidadeMinima) return false;
    return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
  });

  const tbody = document.querySelector("#produtosBaixoEstoqueTable tbody");
  if (!tbody) return;

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

function showLoadingIndicator(show) {
  const indicator = document.getElementById("dashboardLoading");
  if (indicator) {
    indicator.style. display = show ? "block" : "none";
  }
}

// Atualizar dashboard
function refreshDashboard() {
  loadKPIsFromAPI();
  loadChartsFromAPI();
  loadProdutosBaixoEstoque();
  showAlert("Dashboard atualizado com sucesso!", "success");
}

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

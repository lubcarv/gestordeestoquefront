function loadCategoriasChartFromAPI(dados) {
  const ctx = document.getElementById("categoriasChart");
  if (!ctx) return;

  const categorias = dados.map((item) => ({
    nome: item.nomeCategoria || "N/A",
    quantidade: item.quantidade || 0,
    percentual: item.percentual || 0,
  }));

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

  charts.categorias = new Chart(ctx. getContext("2d"), {
    type: "doughnut",
    data: {
      labels: categorias.map((item) => item.nome),
      datasets: [
        {
          data: categorias.map((item) => item.quantidade),
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
        tooltip: {
          callbacks: {
            label: function (context) {
              const categoria = categorias[context.dataIndex];
              return `${categoria.nome}: ${categoria. percentual}%`;
            },
          },
        },
      },
    },
  });
}


async function loadChartsFromAPI() {
  try {
    dashboardLoading = true;
    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();

    const [topVendidos, menosVendidos, movimentacoes, categorias] = await Promise.all([
      DashboardAPI.getTopVendidos(mes, ano, 10). catch(() => null),
      DashboardAPI. getMenosVendidos(mes, ano, 10).catch(() => null),
      DashboardAPI.getMovimentacoesPeriodo(mes, ano).catch(() => null),
      DashboardAPI.getCategoriasVendidas(mes, ano).catch(() => null), // ✅ NOVO
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

    if (categorias && categorias.length > 0) {
      loadCategoriasChartFromAPI(categorias);
    } else {
      loadCategoriasChart(); 
    }

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


function loadCategoriasChart() {
  const ctx = document.getElementById("categoriasChart");
  if (!ctx) return;

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
    "rgba(241, 196, 15, 0. 8)",
    "rgba(230, 126, 34, 0.8)",
    "rgba(231, 76, 60, 0.8)",
    "rgba(149, 165, 166, 0.8)",
    "rgba(52, 73, 94, 0. 8)",
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
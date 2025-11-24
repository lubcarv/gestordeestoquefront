// Sistema de Relatórios e Exportações

// Carregar filtros dos relatórios
function loadReportsFilters() {
    // Carregar categorias
    const categorias = Storage.getAll('categorias').filter(c => c.ativa);
    const categoriaSelect = document.getElementById('categoriaRelatorio');
    
    categoriaSelect.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach(categoria => {
        const option = new Option(categoria.nome, categoria.id);
        categoriaSelect.appendChild(option);
    });
    
    // Carregar fornecedores
    const fornecedores = Storage.getAll('fornecedores').filter(f => f.ativo);
    const fornecedorSelect = document.getElementById('fornecedorRelatorio');
    
    fornecedorSelect.innerHTML = '<option value="">Todos os fornecedores</option>';
    fornecedores.forEach(fornecedor => {
        const option = new Option(fornecedor.nome, fornecedor.id);
        fornecedorSelect.appendChild(option);
    });
    
    // Definir datas padrão (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('dataInicioMovimentacoes').value = trintaDiasAtras.toISOString().split('T')[0];
    document.getElementById('dataFimMovimentacoes').value = hoje.toISOString().split('T')[0];
}

// ==================== EXPORTAÇÕES EXCEL ====================

function exportProductsExcel() {
    try {
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        const dadosExcel = produtos.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            const produtoObj = new Produto(produto);
            const situacaoEstoque = produtoObj.getSituacaoEstoque();
            
            return {
                'Código': produto.codigo,
                'Nome': produto.nome,
                'Descrição': produto.descricao || '',
                'Preço': `R$ ${parseFloat(produto.preco).toFixed(2)}`,
                'Unidade': produto.unidadeMedida,
                'Dimensões': produto.dimensoes || '',
                'Cor': produto.cor || '',
                'Categoria': categoria ? categoria.nome : '',
                'Fornecedor': fornecedor ? fornecedor.nome : '',
                'Estoque Atual': produto.estoqueAtual || 0,
                'Estoque Mínimo': produto.quantidadeMinima || '',
                'Estoque Ideal': produto.quantidadeIdeal || '',
                'Estoque Máximo': produto.quantidadeMaxima || '',
                'Situação Estoque': situacaoEstoque.label,
                'Status': produto.ativo ? 'Ativo' : 'Inativo',
                'Data Criação': produto.dataCriacao ? new Date(produto.dataCriacao).toLocaleDateString('pt-BR') : '',
                'Data Atualização': produto.dataAtualizacao ? new Date(produto.dataAtualizacao).toLocaleDateString('pt-BR') : ''
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
        
        // Ajustar largura das colunas
        const colWidths = [
            { wch: 15 }, // Código
            { wch: 30 }, // Nome
            { wch: 40 }, // Descrição
            { wch: 12 }, // Preço
            { wch: 10 }, // Unidade
            { wch: 15 }, // Dimensões
            { wch: 10 }, // Cor
            { wch: 20 }, // Categoria
            { wch: 25 }, // Fornecedor
            { wch: 12 }, // Estoque Atual
            { wch: 12 }, // Estoque Mínimo
            { wch: 12 }, // Estoque Ideal
            { wch: 12 }, // Estoque Máximo
            { wch: 15 }, // Situação Estoque
            { wch: 10 }, // Status
            { wch: 12 }, // Data Criação
            { wch: 12 }  // Data Atualização
        ];
        ws['!cols'] = colWidths;
        
        XLSX.writeFile(wb, `produtos_${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Relatório de produtos exportado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

function exportMovimentacoesExcel() {
    try {
        const dataInicio = document.getElementById('dataInicioMovimentacoes').value;
        const dataFim = document.getElementById('dataFimMovimentacoes').value;
        const tipoFiltro = document.getElementById('tipoMovimentacao').value;
        
        let movimentacoes = Storage.getAll('movimentacoes');
        const produtos = Storage.getAll('produtos');
        
        // Aplicar filtros
        if (dataInicio) {
            movimentacoes = movimentacoes.filter(mov => 
                new Date(mov.dataHora) >= new Date(dataInicio)
            );
        }
        
        if (dataFim) {
            const dataFimFiltro = new Date(dataFim);
            dataFimFiltro.setHours(23, 59, 59, 999);
            movimentacoes = movimentacoes.filter(mov => 
                new Date(mov.dataHora) <= dataFimFiltro
            );
        }
        
        if (tipoFiltro) {
            movimentacoes = movimentacoes.filter(mov => mov.tipo === tipoFiltro);
        }
        
        const dadosExcel = movimentacoes.map(mov => {
            const produto = produtos.find(p => p.id === mov.produtoId);
            
            return {
                'Data/Hora': new Date(mov.dataHora).toLocaleString('pt-BR'),
                'Produto': produto ? `${produto.codigo} - ${produto.nome}` : 'Produto não encontrado',
                'Tipo': mov.tipo,
                'Quantidade': mov.quantidade,
                'Quantidade Anterior': mov.quantidadeAnterior,
                'Quantidade Atual': mov.quantidadeAtual,
                'Usuário': mov.usuario,
                'Observação': mov.observacao
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
        
        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 18 }, // Data/Hora
            { wch: 40 }, // Produto
            { wch: 10 }, // Tipo
            { wch: 12 }, // Quantidade
            { wch: 15 }, // Quantidade Anterior
            { wch: 15 }, // Quantidade Atual
            { wch: 20 }, // Usuário
            { wch: 30 }  // Observação
        ];
        
        XLSX.writeFile(wb, `movimentacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Relatório de movimentações exportado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

function exportEstoqueBaixoExcel() {
    try {
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        const produtosBaixoEstoque = produtos.filter(produto => {
            if (!produto.quantidadeMinima) return false;
            return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
        });
        
        const dadosExcel = produtosBaixoEstoque.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            
            return {
                'Código': produto.codigo,
                'Nome': produto.nome,
                'Categoria': categoria ? categoria.nome : '',
                'Fornecedor': fornecedor ? fornecedor.nome : '',
                'Estoque Atual': produto.estoqueAtual || 0,
                'Estoque Mínimo': produto.quantidadeMinima,
                'Diferença': (produto.estoqueAtual || 0) - produto.quantidadeMinima,
                'Sugestão Compra': Math.max(0, produto.quantidadeIdeal - (produto.estoqueAtual || 0)),
                'Email Fornecedor': fornecedor ? fornecedor.email : '',
                'Telefone Fornecedor': fornecedor ? fornecedor.fone : ''
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estoque Baixo');
        
        ws['!cols'] = [
            { wch: 15 }, // Código
            { wch: 30 }, // Nome
            { wch: 20 }, // Categoria
            { wch: 25 }, // Fornecedor
            { wch: 12 }, // Estoque Atual
            { wch: 12 }, // Estoque Mínimo
            { wch: 10 }, // Diferença
            { wch: 15 }, // Sugestão Compra
            { wch: 25 }, // Email Fornecedor
            { wch: 18 }  // Telefone Fornecedor
        ];
        
        XLSX.writeFile(wb, `estoque_baixo_${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Relatório de estoque baixo exportado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

function exportCategoriaExcel() {
    try {
        const categoriaId = document.getElementById('categoriaRelatorio').value;
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        let produtosFiltrados = produtos;
        if (categoriaId) {
            produtosFiltrados = produtos.filter(p => p.categoriaId === parseInt(categoriaId));
        }
        
        const dadosExcel = produtosFiltrados.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            
            return {
                'Categoria': categoria ? categoria.nome : '',
                'Código': produto.codigo,
                'Nome': produto.nome,
                'Fornecedor': fornecedor ? fornecedor.nome : '',
                'Preço': `R$ ${parseFloat(produto.preco).toFixed(2)}`,
                'Estoque Atual': produto.estoqueAtual || 0,
                'Status': produto.ativo ? 'Ativo' : 'Inativo'
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produtos por Categoria');
        
        ws['!cols'] = [
            { wch: 20 }, // Categoria
            { wch: 15 }, // Código
            { wch: 30 }, // Nome
            { wch: 25 }, // Fornecedor
            { wch: 12 }, // Preço
            { wch: 12 }, // Estoque Atual
            { wch: 10 }  // Status
        ];
        
        const nomeArquivo = categoriaId ? 
            `categoria_${categorias.find(c => c.id === parseInt(categoriaId))?.nome || 'categoria'}_${new Date().toISOString().split('T')[0]}.xlsx` :
            `todas_categorias_${new Date().toISOString().split('T')[0]}.xlsx`;
            
        XLSX.writeFile(wb, nomeArquivo);
        showAlert('Relatório por categoria exportado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

function exportFornecedorExcel() {
    try {
        const fornecedorId = document.getElementById('fornecedorRelatorio').value;
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        let produtosFiltrados = produtos;
        if (fornecedorId) {
            produtosFiltrados = produtos.filter(p => p.fornecedorId === parseInt(fornecedorId));
        }
        
        const dadosExcel = produtosFiltrados.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            
            return {
                'Fornecedor': fornecedor ? fornecedor.nome : '',
                'Email': fornecedor ? fornecedor.email : '',
                'Telefone': fornecedor ? fornecedor.fone : '',
                'Código': produto.codigo,
                'Nome': produto.nome,
                'Categoria': categoria ? categoria.nome : '',
                'Preço': `R$ ${parseFloat(produto.preco).toFixed(2)}`,
                'Estoque Atual': produto.estoqueAtual || 0,
                'Status': produto.ativo ? 'Ativo' : 'Inativo'
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produtos por Fornecedor');
        
        ws['!cols'] = [
            { wch: 25 }, // Fornecedor
            { wch: 25 }, // Email
            { wch: 18 }, // Telefone
            { wch: 15 }, // Código
            { wch: 30 }, // Nome
            { wch: 20 }, // Categoria
            { wch: 12 }, // Preço
            { wch: 12 }, // Estoque Atual
            { wch: 10 }  // Status
        ];
        
        const nomeArquivo = fornecedorId ? 
            `fornecedor_${fornecedores.find(f => f.id === parseInt(fornecedorId))?.nome || 'fornecedor'}_${new Date().toISOString().split('T')[0]}.xlsx` :
            `todos_fornecedores_${new Date().toISOString().split('T')[0]}.xlsx`;
            
        XLSX.writeFile(wb, nomeArquivo);
        showAlert('Relatório por fornecedor exportado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

// ==================== EXPORTAÇÕES PDF ====================

function exportProductsPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
        
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        // Título
        doc.setFontSize(16);
        doc.text('Relatório de Produtos', 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
        doc.text(`Total de produtos: ${produtos.length}`, 20, 35);
        
        // Preparar dados para tabela
        const dadosTabela = produtos.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            const produtoObj = new Produto(produto);
            const situacaoEstoque = produtoObj.getSituacaoEstoque();
            
            return [
                produto.codigo,
                produto.nome,
                categoria ? categoria.nome : '',
                fornecedor ? fornecedor.nome : '',
                `R$ ${parseFloat(produto.preco).toFixed(2)}`,
                produto.estoqueAtual || 0,
                situacaoEstoque.label,
                produto.ativo ? 'Ativo' : 'Inativo'
            ];
        });
        
        // Criar tabela
        doc.autoTable({
            head: [['Código', 'Nome', 'Categoria', 'Fornecedor', 'Preço', 'Estoque', 'Situação', 'Status']],
            body: dadosTabela,
            startY: 45,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 73, 94] },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 },
                4: { cellWidth: 20 },
                5: { cellWidth: 15 },
                6: { cellWidth: 25 },
                7: { cellWidth: 15 }
            }
        });
        
        doc.save(`produtos_${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Relatório PDF de produtos gerado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao gerar PDF: ' + error.message, 'error');
    }
}

function exportMovimentacoesPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        
        const dataInicio = document.getElementById('dataInicioMovimentacoes').value;
        const dataFim = document.getElementById('dataFimMovimentacoes').value;
        const tipoFiltro = document.getElementById('tipoMovimentacao').value;
        
        let movimentacoes = Storage.getAll('movimentacoes');
        const produtos = Storage.getAll('produtos');
        
        // Aplicar filtros
        if (dataInicio) {
            movimentacoes = movimentacoes.filter(mov => 
                new Date(mov.dataHora) >= new Date(dataInicio)
            );
        }
        
        if (dataFim) {
            const dataFimFiltro = new Date(dataFim);
            dataFimFiltro.setHours(23, 59, 59, 999);
            movimentacoes = movimentacoes.filter(mov => 
                new Date(mov.dataHora) <= dataFimFiltro
            );
        }
        
        if (tipoFiltro) {
            movimentacoes = movimentacoes.filter(mov => mov.tipo === tipoFiltro);
        }
        
        // Título
        doc.setFontSize(16);
        doc.text('Relatório de Movimentações', 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
        doc.text(`Período: ${dataInicio || 'Início'} até ${dataFim || 'Hoje'}`, 20, 35);
        doc.text(`Tipo: ${tipoFiltro || 'Todos'}`, 20, 40);
        doc.text(`Total de movimentações: ${movimentacoes.length}`, 20, 45);
        
        // Preparar dados
        const dadosTabela = movimentacoes.map(mov => {
            const produto = produtos.find(p => p.id === mov.produtoId);
            
            return [
                new Date(mov.dataHora).toLocaleString('pt-BR'),
                produto ? produto.codigo : 'N/A',
                produto ? produto.nome : 'Produto não encontrado',
                mov.tipo,
                mov.quantidade,
                mov.quantidadeAtual,
                mov.usuario
            ];
        });
        
        doc.autoTable({
            head: [['Data/Hora', 'Código', 'Produto', 'Tipo', 'Qtd', 'Saldo', 'Usuário']],
            body: dadosTabela,
            startY: 55,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 73, 94] },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 20 },
                2: { cellWidth: 60 },
                3: { cellWidth: 20 },
                4: { cellWidth: 15 },
                5: { cellWidth: 15 },
                6: { cellWidth: 30 }
            }
        });
        
        doc.save(`movimentacoes_${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Relatório PDF de movimentações gerado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao gerar PDF: ' + error.message, 'error');
    }
}

function exportEstoqueBaixoPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        const produtosBaixoEstoque = produtos.filter(produto => {
            if (!produto.quantidadeMinima) return false;
            return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
        });
        
        // Título
        doc.setFontSize(16);
        doc.text('Produtos com Estoque Baixo', 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
        doc.text(`Produtos com estoque baixo: ${produtosBaixoEstoque.length}`, 20, 35);
        
        // Preparar dados
        const dadosTabela = produtosBaixoEstoque.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            
            return [
                produto.codigo,
                produto.nome,
                categoria ? categoria.nome : '',
                produto.estoqueAtual || 0,
                produto.quantidadeMinima,
                fornecedor ? fornecedor.nome : ''
            ];
        });
        
        doc.autoTable({
            head: [['Código', 'Produto', 'Categoria', 'Atual', 'Mínimo', 'Fornecedor']],
            body: dadosTabela,
            startY: 45,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [243, 156, 18] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { cellWidth: 30 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 35 }
            }
        });
        
        doc.save(`estoque_baixo_${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Relatório PDF de estoque baixo gerado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao gerar PDF: ' + error.message, 'error');
    }
}

function exportCategoriaPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        
        const categoriaId = document.getElementById('categoriaRelatorio').value;
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        let produtosFiltrados = produtos;
        let tituloCategoria = 'Todas as Categorias';
        
        if (categoriaId) {
            produtosFiltrados = produtos.filter(p => p.categoriaId === parseInt(categoriaId));
            const categoria = categorias.find(c => c.id === parseInt(categoriaId));
            tituloCategoria = categoria ? categoria.nome : 'Categoria não encontrada';
        }
        
        // Título
        doc.setFontSize(16);
        doc.text(`Relatório por Categoria: ${tituloCategoria}`, 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
        doc.text(`Total de produtos: ${produtosFiltrados.length}`, 20, 35);
        
        // Preparar dados
        const dadosTabela = produtosFiltrados.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            
            return [
                categoria ? categoria.nome : '',
                produto.codigo,
                produto.nome,
                fornecedor ? fornecedor.nome : '',
                `R$ ${parseFloat(produto.preco).toFixed(2)}`,
                produto.estoqueAtual || 0,
                produto.ativo ? 'Ativo' : 'Inativo'
            ];
        });
        
        doc.autoTable({
            head: [['Categoria', 'Código', 'Produto', 'Fornecedor', 'Preço', 'Estoque', 'Status']],
            body: dadosTabela,
            startY: 45,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [52, 73, 94] }
        });
        
        const nomeArquivo = categoriaId ? 
            `categoria_${tituloCategoria}_${new Date().toISOString().split('T')[0]}.pdf` :
            `todas_categorias_${new Date().toISOString().split('T')[0]}.pdf`;
            
        doc.save(nomeArquivo);
        showAlert('Relatório PDF por categoria gerado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao gerar PDF: ' + error.message, 'error');
    }
}

function exportFornecedorPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        
        const fornecedorId = document.getElementById('fornecedorRelatorio').value;
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias');
        const fornecedores = Storage.getAll('fornecedores');
        
        let produtosFiltrados = produtos;
        let tituloFornecedor = 'Todos os Fornecedores';
        
        if (fornecedorId) {
            produtosFiltrados = produtos.filter(p => p.fornecedorId === parseInt(fornecedorId));
            const fornecedor = fornecedores.find(f => f.id === parseInt(fornecedorId));
            tituloFornecedor = fornecedor ? fornecedor.nome : 'Fornecedor não encontrado';
        }
        
        // Título
        doc.setFontSize(16);
        doc.text(`Relatório por Fornecedor: ${tituloFornecedor}`, 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
        doc.text(`Total de produtos: ${produtosFiltrados.length}`, 20, 35);
        
        // Preparar dados
        const dadosTabela = produtosFiltrados.map(produto => {
            const categoria = categorias.find(c => c.id === produto.categoriaId);
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            
            return [
                fornecedor ? fornecedor.nome : '',
                produto.codigo,
                produto.nome,
                categoria ? categoria.nome : '',
                `R$ ${parseFloat(produto.preco).toFixed(2)}`,
                produto.estoqueAtual || 0,
                produto.ativo ? 'Ativo' : 'Inativo'
            ];
        });
        
        doc.autoTable({
            head: [['Fornecedor', 'Código', 'Produto', 'Categoria', 'Preço', 'Estoque', 'Status']],
            body: dadosTabela,
            startY: 45,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [52, 73, 94] }
        });
        
        const nomeArquivo = fornecedorId ? 
            `fornecedor_${tituloFornecedor}_${new Date().toISOString().split('T')[0]}.pdf` :
            `todos_fornecedores_${new Date().toISOString().split('T')[0]}.pdf`;
            
        doc.save(nomeArquivo);
        showAlert('Relatório PDF por fornecedor gerado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao gerar PDF: ' + error.message, 'error');
    }
}

function exportDashboardPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(20);
        doc.text('Relatório Executivo - Dashboard', 20, 25);
        
        doc.setFontSize(12);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 35);
        
        // KPIs
        const produtos = Storage.getAll('produtos');
        const categorias = Storage.getAll('categorias').filter(c => c.ativa);
        const fornecedores = Storage.getAll('fornecedores').filter(f => f.ativo);
        const produtosBaixoEstoque = produtos.filter(produto => {
            if (!produto.quantidadeMinima) return false;
            return (produto.estoqueAtual || 0) <= produto.quantidadeMinima;
        });
        
        doc.setFontSize(14);
        doc.text('Indicadores Principais (KPIs)', 20, 50);
        
        doc.setFontSize(11);
        doc.text(`• Total de Produtos: ${produtos.length}`, 30, 60);
        doc.text(`• Categorias Ativas: ${categorias.length}`, 30, 68);
        doc.text(`• Fornecedores Ativos: ${fornecedores.length}`, 30, 76);
        doc.text(`• Produtos com Estoque Baixo: ${produtosBaixoEstoque.length}`, 30, 84);
        
        // Análise por Status de Estoque
        let semEstoque = 0;
        let estoqueBaixo = 0;
        let estoqueOk = 0;
        
        produtos.forEach(produto => {
            const produtoObj = new Produto(produto);
            const situacao = produtoObj.getSituacaoEstoque();
            
            switch(situacao.status) {
                case 'SEM_ESTOQUE': semEstoque++; break;
                case 'BAIXO': estoqueBaixo++; break;
                case 'OK': estoqueOk++; break;
            }
        });
        
        doc.setFontSize(14);
        doc.text('Análise de Estoque', 20, 100);
        
        doc.setFontSize(11);
        doc.text(`• Produtos sem estoque: ${semEstoque}`, 30, 110);
        doc.text(`• Produtos com estoque baixo: ${estoqueBaixo}`, 30, 118);
        doc.text(`• Produtos com estoque adequado: ${estoqueOk}`, 30, 126);
        
        // Top 5 produtos com maior saída
        const movimentacoes = Storage.getAll('movimentacoes');
        const saidasPorProduto = {};
        
        movimentacoes
            .filter(m => m.tipo === 'SAIDA')
            .forEach(mov => {
                if (!saidasPorProduto[mov.produtoId]) {
                    saidasPorProduto[mov.produtoId] = 0;
                }
                saidasPorProduto[mov.produtoId] += mov.quantidade;
            });
        
        const topSaidas = Object.entries(saidasPorProduto)
            .map(([produtoId, quantidade]) => {
                const produto = produtos.find(p => p.id === parseInt(produtoId));
                return {
                    nome: produto ? produto.nome : 'Produto não encontrado',
                    quantidade: quantidade
                };
            })
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);
        
        doc.setFontSize(14);
        doc.text('Top 5 - Produtos com Maior Saída', 20, 145);
        
        doc.setFontSize(10);
        topSaidas.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.nome}: ${item.quantidade} unidades`, 30, 155 + (index * 8));
        });
        
        // Recomendações
        doc.setFontSize(14);
        doc.text('Recomendações', 20, 200);
        
        doc.setFontSize(10);
        let yPos = 210;
        
        if (produtosBaixoEstoque.length > 0) {
            doc.text(`• Reabastecer ${produtosBaixoEstoque.length} produto(s) com estoque baixo`, 30, yPos);
            yPos += 8;
        }
        
        if (semEstoque > 0) {
            doc.text(`• Urgente: ${semEstoque} produto(s) sem estoque`, 30, yPos);
            yPos += 8;
        }
        
        doc.text('• Monitorar produtos com alta rotatividade para evitar ruptura', 30, yPos);
        yPos += 8;
        doc.text('• Revisar níveis mínimos de estoque baseado no histórico de saídas', 30, yPos);
        
        doc.save(`dashboard_executivo_${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Relatório executivo gerado com sucesso!', 'success');
        
    } catch (error) {
        showAlert('Erro ao gerar relatório executivo: ' + error.message, 'error');
    }
}
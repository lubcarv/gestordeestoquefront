// Modelos de dados baseados nos DTOs Java

class Categoria {
    constructor(data = {}) {
        this.id = data.id || null;
        this.nome = data.nome || '';
        this.descricao = data.descricao || '';
        this.ativa = data.ativa !== undefined ? data.ativa : true;
        this.dataCriacao = data.dataCriacao || null;
        this.dataAtualizacao = data.dataAtualizacao || null;
    }

    static validate(data) {
        const errors = [];

        if (!data.nome || data.nome.trim().length < 2) {
            errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
        }

        if (data.nome && data.nome.length > 50) {
            errors.push('Nome deve ter no máximo 50 caracteres');
        }

        if (data.descricao && data.descricao.length > 200) {
            errors.push('Descrição deve ter no máximo 200 caracteres');
        }

        return errors;
    }

    static checkDuplicateName(nome, excludeId = null) {
        return Storage.exists('categorias', 'nome', nome, excludeId);
    }
}

class Fornecedor {
    constructor(data = {}) {
        this.id = data.id || null;
        this.nome = data.nome || '';
        this.email = data.email || '';
        this.fone = data.fone || '';
        this.cnpj = data.cnpj || '';
        this.endereco = data.endereco || '';
        this.ativo = data.ativo !== undefined ? data.ativo : true;
        this.dataCriacao = data.dataCriacao || null;
        this.dataAtualizacao = data.dataAtualizacao || null;
    }

    static validate(data) {
        const errors = [];

        if (!data.nome || data.nome.trim().length < 2) {
            errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
        }

        if (data.nome && data.nome.length > 100) {
            errors.push('Nome deve ter no máximo 100 caracteres');
        }

        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Email deve ter formato válido');
        }

        if (data.email && data.email.length > 100) {
            errors.push('Email deve ter no máximo 100 caracteres');
        }

        if (data.fone && data.fone.length > 20) {
            errors.push('Telefone deve ter no máximo 20 caracteres');
        }

        if (data.cnpj && data.cnpj.length > 14) {
            errors.push('CNPJ deve ter no máximo 14 caracteres');
        }

        if (data.endereco && data.endereco.length > 200) {
            errors.push('Endereço deve ter no máximo 200 caracteres');
        }

        return errors;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static checkDuplicateEmail(email, excludeId = null) {
        if (!email) return false;
        return Storage.exists('fornecedores', 'email', email, excludeId);
    }

    static checkDuplicateCnpj(cnpj, excludeId = null) {
        if (!cnpj) return false;
        return Storage.exists('fornecedores', 'cnpj', cnpj, excludeId);
    }
}

class Produto {
    constructor(data = {}) {
        this.id = data.id || null;
        this.codigo = data.codigo || '';
        this.nome = data.nome || '';
        this.descricao = data.descricao || '';
        this.preco = data.preco || 0;
        this.unidadeMedida = data.unidadeMedida || '';
        this.dimensoes = data.dimensoes || '';
        this.cor = data.cor || '';
        this.quantidadeMinima = data.quantidadeMinima || null;
        this.quantidadeIdeal = data.quantidadeIdeal || null;
        this.quantidadeMaxima = data.quantidadeMaxima || null;
        this.ativo = data.ativo !== undefined ? data.ativo : true;
        this.categoriaId = data.categoriaId || null;
        this.fornecedorId = data.fornecedorId || null;
        this.estoqueAtual = data.estoqueAtual || 0;
        this.dataCriacao = data.dataCriacao || null;
        this.dataAtualizacao = data.dataAtualizacao || null;
    }

    static validate(data) {
        const errors = [];

        if (!data.codigo || data.codigo.trim().length === 0) {
            errors.push('Código é obrigatório');
        }

        if (data.codigo && data.codigo.length > 50) {
            errors.push('Código deve ter no máximo 50 caracteres');
        }

        if (!data.nome || data.nome.trim().length < 2) {
            errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
        }

        if (data.nome && data.nome.length > 100) {
            errors.push('Nome deve ter no máximo 100 caracteres');
        }

        if (data.descricao && data.descricao.length > 500) {
            errors.push('Descrição deve ter no máximo 500 caracteres');
        }

        if (!data.preco || data.preco <= 0) {
            errors.push('Preço é obrigatório e deve ser positivo');
        }

        if (!data.unidadeMedida || data.unidadeMedida.trim().length === 0) {
            errors.push('Unidade de medida é obrigatória');
        }

        if (data.unidadeMedida && data.unidadeMedida.length > 10) {
            errors.push('Unidade de medida deve ter no máximo 10 caracteres');
        }

        if (data.dimensoes && data.dimensoes.length > 100) {
            errors.push('Dimensões deve ter no máximo 100 caracteres');
        }

        if (data.cor && data.cor.length > 30) {
            errors.push('Cor deve ter no máximo 30 caracteres');
        }

        if (data.quantidadeMinima && data.quantidadeMinima <= 0) {
            errors.push('Quantidade mínima deve ser maior que zero');
        }

        if (data.quantidadeIdeal && data.quantidadeIdeal < 0) {
            errors.push('Quantidade ideal deve ser zero ou positiva');
        }

        if (data.quantidadeMaxima && data.quantidadeMaxima < 0) {
            errors.push('Quantidade máxima deve ser zero ou positiva');
        }

        if (!data.categoriaId) {
            errors.push('Categoria é obrigatória');
        }

        if (!data.fornecedorId) {
            errors.push('Fornecedor é obrigatório');
        }

        return errors;
    }

    static checkDuplicateCodigo(codigo, excludeId = null) {
        return Storage.exists('produtos', 'codigo', codigo, excludeId);
    }

    static checkDuplicateNameAndCategory(nome, categoriaId, excludeId = null) {
        const produtos = Storage.getAll('produtos');
        return produtos.some(produto => 
            produto.nome.toLowerCase() === nome.toLowerCase() &&
            produto.categoriaId === parseInt(categoriaId) &&
            produto.id !== excludeId
        );
    }

    getCategoriaNome() {
        const categoria = Storage.findById('categorias', this.categoriaId);
        return categoria ? categoria.nome : 'N/A';
    }

    getFornecedorNome() {
        const fornecedor = Storage.findById('fornecedores', this.fornecedorId);
        return fornecedor ? fornecedor.nome : 'N/A';
    }

    getSituacaoEstoque() {
        if (this.estoqueAtual === 0) {
            return { status: 'SEM_ESTOQUE', label: 'Sem Estoque', class: 'status-inativo' };
        } else if (this.quantidadeMinima && this.estoqueAtual <= this.quantidadeMinima) {
            return { status: 'BAIXO', label: 'Estoque Baixo', class: 'status-baixo' };
        } else {
            return { status: 'OK', label: 'Estoque OK', class: 'status-ok' };
        }
    }
}

class MovimentacaoEstoque {
    constructor(data = {}) {
        this.id = data.id || null;
        this.produtoId = data.produtoId || null;
        this.tipo = data.tipo || ''; // 'ENTRADA' ou 'SAIDA'
        this.quantidade = data.quantidade || 0;
        this.quantidadeAnterior = data.quantidadeAnterior || 0;
        this.quantidadeAtual = data.quantidadeAtual || 0;
        this.usuario = data.usuario || '';
        this.observacao = data.observacao || '';
        this.dataHora = data.dataHora || null;
    }

    static validate(data) {
        const errors = [];

        if (!data.produtoId) {
            errors.push('Produto é obrigatório');
        }

        if (!data.tipo || !['ENTRADA', 'SAIDA'].includes(data.tipo)) {
            errors.push('Tipo de movimentação inválido');
        }

        if (!data.quantidade || data.quantidade <= 0) {
            errors.push('Quantidade deve ser maior que zero');
        }

        if (!data.usuario || data.usuario.trim().length === 0) {
            errors.push('Usuário responsável é obrigatório');
        }

        return errors;
    }

    static registrarEntrada(produtoId, quantidade, usuario, observacao = 'Entrada de estoque') {
        const produto = Storage.findById('produtos', produtoId);
        if (!produto) {
            throw new Error('Produto não encontrado');
        }

        const quantidadeAnterior = produto.estoqueAtual || 0;
        const quantidadeAtual = quantidadeAnterior + quantidade;

        // Atualizar estoque do produto
        produto.estoqueAtual = quantidadeAtual;
        Storage.save('produtos', produto);

        // Registrar movimentação
        const movimentacao = new MovimentacaoEstoque({
            produtoId: parseInt(produtoId),
            tipo: 'ENTRADA',
            quantidade: quantidade,
            quantidadeAnterior: quantidadeAnterior,
            quantidadeAtual: quantidadeAtual,
            usuario: usuario,
            observacao: observacao
        });

        return Storage.saveMovimentacao(movimentacao);
    }

    static registrarSaida(produtoId, quantidade, usuario, observacao = 'Saída de estoque') {
        const produto = Storage.findById('produtos', produtoId);
        if (!produto) {
            throw new Error('Produto não encontrado');
        }

        const quantidadeAnterior = produto.estoqueAtual || 0;
        
        if (quantidadeAnterior < quantidade) {
            throw new Error(`Estoque insuficiente. Disponível: ${quantidadeAnterior}, Solicitado: ${quantidade}`);
        }

        const quantidadeAtual = quantidadeAnterior - quantidade;

        // Atualizar estoque do produto
        produto.estoqueAtual = quantidadeAtual;
        Storage.save('produtos', produto);

        // Registrar movimentação
        const movimentacao = new MovimentacaoEstoque({
            produtoId: parseInt(produtoId),
            tipo: 'SAIDA',
            quantidade: quantidade,
            quantidadeAnterior: quantidadeAnterior,
            quantidadeAtual: quantidadeAtual,
            usuario: usuario,
            observacao: observacao
        });

        return Storage.saveMovimentacao(movimentacao);
    }

    getProdutoNome() {
        const produto = Storage.findById('produtos', this.produtoId);
        return produto ? produto.nome : 'N/A';
    }

    getDataHoraFormatada() {
        if (!this.dataHora) return 'N/A';
        return new Date(this.dataHora).toLocaleString('pt-BR');
    }
}
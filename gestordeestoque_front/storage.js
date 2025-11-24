// Sistema de armazenamento local para simular banco de dados
class Storage {
    static getNextId(entity) {
        const items = this.getAll(entity);
        if (items.length === 0) return 1;
        return Math.max(...items.map(item => item.id)) + 1;
    }

    static getAll(entity) {
        const data = localStorage.getItem(entity);
        return data ? JSON.parse(data) : [];
    }

    static save(entity, item) {
        const items = this.getAll(entity);
        
        if (item.id) {
            // Atualizar item existente
            const index = items.findIndex(i => i.id === item.id);
            if (index !== -1) {
                items[index] = { ...items[index], ...item };
            }
        } else {
            // Criar novo item
            item.id = this.getNextId(entity);
            item.dataCriacao = new Date().toISOString();
            items.push(item);
        }
        
        item.dataAtualizacao = new Date().toISOString();
        localStorage.setItem(entity, JSON.stringify(items));
        return item;
    }

    static findById(entity, id) {
        const items = this.getAll(entity);
        return items.find(item => item.id === parseInt(id));
    }

    static delete(entity, id) {
        const items = this.getAll(entity);
        const filteredItems = items.filter(item => item.id !== parseInt(id));
        localStorage.setItem(entity, JSON.stringify(filteredItems));
    }

    static exists(entity, field, value, excludeId = null) {
        const items = this.getAll(entity);
        return items.some(item => 
            item[field] && 
            item[field].toLowerCase() === value.toLowerCase() && 
            item.id !== excludeId
        );
    }

    static findByField(entity, field, value) {
        const items = this.getAll(entity);
        return items.filter(item => 
            item[field] && 
            item[field].toLowerCase().includes(value.toLowerCase())
        );
    }

    static countRelated(entity, field, id) {
        const items = this.getAll(entity);
        return items.filter(item => item[field] === parseInt(id)).length;
    }

    static clear(entity) {
        localStorage.removeItem(entity);
    }

    static clearAll() {
        localStorage.clear();
    }

    // Métodos específicos para movimentações de estoque
    static saveMovimentacao(movimentacao) {
        const movimentacoes = this.getAll('movimentacoes');
        movimentacao.id = this.getNextId('movimentacoes');
        movimentacao.dataHora = new Date().toISOString();
        movimentacoes.push(movimentacao);
        localStorage.setItem('movimentacoes', JSON.stringify(movimentacoes));
        return movimentacao;
    }

    static getMovimentacoesByProduto(produtoId) {
        const movimentacoes = this.getAll('movimentacoes');
        return movimentacoes
            .filter(m => m.produtoId === parseInt(produtoId))
            .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    }

    // Inicializar dados de exemplo
    static initializeData() {
        // Verificar se já existem dados
        if (this.getAll('categorias').length > 0) return;

        // Categorias de exemplo
        const categorias = [
            { nome: 'Eletrônicos', descricao: 'Produtos eletrônicos e tecnologia', ativa: true },
            { nome: 'Roupas', descricao: 'Vestuário e acessórios', ativa: true },
            { nome: 'Casa e Jardim', descricao: 'Produtos para casa e jardim', ativa: true },
            { nome: 'Esportes', descricao: 'Artigos esportivos', ativa: true }
        ];

        categorias.forEach(categoria => this.save('categorias', categoria));

        // Fornecedores de exemplo
        const fornecedores = [
            { 
                nome: 'TechSupply Ltda', 
                email: 'contato@techsupply.com', 
                fone: '(11) 99999-0001',
                cnpj: '12345678000195',
                endereco: 'Rua da Tecnologia, 123 - São Paulo/SP',
                ativo: true 
            },
            { 
                nome: 'Moda & Estilo', 
                email: 'vendas@modaestilo.com', 
                fone: '(11) 99999-0002',
                cnpj: '98765432000187',
                endereco: 'Av. Fashion, 456 - São Paulo/SP',
                ativo: true 
            },
            { 
                nome: 'Casa Conforto', 
                email: 'info@casaconforto.com', 
                fone: '(11) 99999-0003',
                cnpj: '11122233000144',
                endereco: 'Rua do Lar, 789 - São Paulo/SP',
                ativo: true 
            }
        ];

        fornecedores.forEach(fornecedor => this.save('fornecedores', fornecedor));

        console.log('Dados de exemplo inicializados com sucesso!');
    }
}

// Inicializar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    Storage.initializeData();
});
// Sistema de gerenciamento de vagas da empresa com integração ao backend
class VagasManager {
    constructor() {
        this.vagas = [];
        this.filtroAtual = 'todas';
        this.loading = false;
        this.apiBaseUrl = 'http://localhost:8080'; // Configure conforme sua API
        this.idEmpresa = this.getidEmpresa(); // Pegar ID da empresa logada
        this.init();
    }

    // Inicialização do sistema
    async init() {
        await this.carregarVagasDoBackend();
        this.setupEventListeners();
        this.renderizarVagas();
        this.atualizarEstatisticas();
    }

    // Pegar ID da empresa (pode vir de token JWT, sessão, etc.)
    getIdEmpresa() {
        // Implementar conforme sua autenticação
        // Exemplo: pegar de localStorage, cookie, ou token JWT
        return localStorage.getItem('idEmpresa') || '1';
    }

    // Carregar vagas do backend
    async carregarVagasDoBackend() {
        try {
            this.setLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/empresas/${this.idEmpresa}/vagas`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}` // Se usar JWT
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            this.vagas = data.vagas || data; // Adaptar conforme estrutura da sua API
            
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
            this.mostrarErro('Erro ao carregar vagas. Tente novamente.');
            this.vagas = []; // Fallback para array vazio
        } finally {
            this.setLoading(false);
        }
    }

    // Pegar token de autenticação
    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // Publicar nova vaga
    async publicarVaga(dadosVaga) {
        try {
            this.setLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/vagas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    ...dadosVaga,
                    idEmpresa: this.idEmpresa,
                    status: 'ativa',
                    dataPublicacao: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const novaVaga = await response.json();
            this.vagas.unshift(novaVaga); // Adicionar no início da lista
            this.renderizarVagas();
            this.atualizarEstatisticas();
            this.mostrarSucesso('Vaga publicada com sucesso!');
            
            return novaVaga;

        } catch (error) {
            console.error('Erro ao publicar vaga:', error);
            this.mostrarErro('Erro ao publicar vaga. Tente novamente.');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // Atualizar vaga existente
    async atualizarVaga(vagaId, dadosAtualizados) {
        try {
            this.setLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/vagas/${vagaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(dadosAtualizados)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const vagaAtualizada = await response.json();
            
            // Atualizar no array local
            const index = this.vagas.findIndex(v => v.id === vagaId);
            if (index !== -1) {
                this.vagas[index] = vagaAtualizada;
                this.renderizarVagas();
                this.atualizarEstatisticas();
            }

            this.mostrarSucesso('Vaga atualizada com sucesso!');
            return vagaAtualizada;

        } catch (error) {
            console.error('Erro ao atualizar vaga:', error);
            this.mostrarErro('Erro ao atualizar vaga. Tente novamente.');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // Alterar status da vaga (ativar/pausar)
    async alterarStatusVaga(vagaId, novoStatus) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/vagas/${vagaId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ status: novoStatus })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            // Atualizar no array local
            const vaga = this.vagas.find(v => v.id === vagaId);
            if (vaga) {
                vaga.status = novoStatus;
                this.renderizarVagas();
                this.atualizarEstatisticas();
            }

            const acao = novoStatus === 'ativa' ? 'ativada' : 'pausada';
            this.mostrarSucesso(`Vaga ${acao} com sucesso!`);

        } catch (error) {
            console.error('Erro ao alterar status:', error);
            this.mostrarErro('Erro ao alterar status da vaga.');
        }
    }

    // Excluir vaga
    async excluirVaga(vagaId) {
        if (!confirm('Tem certeza que deseja excluir esta vaga?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/vagas/${vagaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            // Remover do array local
            this.vagas = this.vagas.filter(v => v.id !== vagaId);
            this.renderizarVagas();
            this.atualizarEstatisticas();
            
            this.mostrarSucesso('Vaga excluída com sucesso!');

        } catch (error) {
            console.error('Erro ao excluir vaga:', error);
            this.mostrarErro('Erro ao excluir vaga.');
        }
    }

    // Buscar candidatos de uma vaga
    async buscarCandidatos(vagaId) {
        try {
            this.setLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/vagas/${vagaId}/candidatos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const candidatos = await response.json();
            this.mostrarModalCandidatos(vagaId, candidatos);

        } catch (error) {
            console.error('Erro ao buscar candidatos:', error);
            this.mostrarErro('Erro ao carregar candidatos.');
        } finally {
            this.setLoading(false);
        }
    }

    // Setup de event listeners
    setupEventListeners() {
        // Filtros de vaga
        document.querySelectorAll('.filtro-vaga').forEach(filtro => {
            filtro.addEventListener('click', (e) => {
                this.filtroAtual = e.target.dataset.filtro;
                this.atualizarFiltroAtivo(e.target);
                this.renderizarVagas();
            });
        });

        // Botão nova vaga
        const novavagaBtn = document.querySelector('[onclick="showSection(\'cadastrar\')"]');
        if (novavagaBtn) {
            novavagaBtn.onclick = () => this.showSection('cadastrar');
        }

        // Botão publicar vaga
        const publicarBtn = document.querySelector('.btn-next');
        if (publicarBtn && publicarBtn.textContent.includes('Publicar')) {
            publicarBtn.addEventListener('click', () => this.handlePublicarVaga());
        }

        // Botão atualizar vagas
        this.criarBotaoAtualizar();
    }

    // Criar botão de atualizar vagas
    criarBotaoAtualizar() {
        const cardHeader = document.querySelector('#vagas .card-header');
        if (cardHeader) {
            const atualizarBtn = document.createElement('button');
            atualizarBtn.className = 'btn btn-secondary';
            atualizarBtn.innerHTML = '🔄 Atualizar';
            atualizarBtn.addEventListener('click', () => this.atualizarVagas());
            cardHeader.appendChild(atualizarBtn);
        }
    }

    // Atualizar vagas manualmente
    async atualizarVagas() {
        await this.carregarVagasDoBackend();
        this.renderizarVagas();
        this.atualizarEstatisticas();
        this.mostrarSucesso('Vagas atualizadas!');
    }

    // Handle publicar vaga do formulário
    async handlePublicarVaga() {
        const form = document.querySelector('#cadastrar');
        const dadosVaga = this.coletarDadosFormulario(form);
        
        if (!this.validarDadosVaga(dadosVaga)) {
            return;
        }

        try {
            await this.publicarVaga(dadosVaga);
            this.limparFormulario(form);
            this.showSection('vagas');
        } catch (error) {
            // Erro já tratado no método publicarVaga
        }
    }

    // Coletar dados do formulário
    coletarDadosFormulario(form) {
        const inputs = form.querySelectorAll('.form-input, .form-textarea');
        const dados = {};
        
        inputs.forEach(input => {
            const label = input.previousElementSibling?.textContent?.toLowerCase() || '';
            
            if (label.includes('título')) dados.titulo = input.value;
            else if (label.includes('contrato')) dados.tipoContrato = input.value;
            else if (label.includes('modalidade')) dados.modalidade = input.value;
            else if (label.includes('salário')) dados.salario = input.value;
            else if (label.includes('localização')) dados.localizacao = input.value;
            else if (label.includes('descrição')) dados.descricao = input.value;
            else if (label.includes('requisitos')) dados.requisitos = input.value;
        });
        
        return dados;
    }

    // Validar dados da vaga
    validarDadosVaga(dados) {
        const camposObrigatorios = ['titulo', 'tipoContrato', 'modalidade', 'salario', 'localizacao', 'descricao'];
        
        for (const campo of camposObrigatorios) {
            if (!dados[campo] || dados[campo].trim() === '') {
                this.mostrarErro(`O campo ${campo} é obrigatório.`);
                return false;
            }
        }
        
        return true;
    }

    // Limpar formulário
    limparFormulario(form) {
        form.querySelectorAll('.form-input, .form-textarea').forEach(input => {
            input.value = '';
        });
    }

    // Renderizar lista de vagas
    renderizarVagas() {
        const container = document.getElementById('vagas');
        if (!container) return;

        const vagasFiltradas = this.filtrarVagas();
        
        // Remover conteúdo existente exceto header
        const existingContent = container.querySelector('.vagas-content');
        if (existingContent) {
            existingContent.remove();
        }

        // Criar container de conteúdo
        const content = document.createElement('div');
        content.className = 'vagas-content';
        
        if (this.loading) {
            content.innerHTML = this.criarLoadingHTML();
        } else if (vagasFiltradas.length === 0) {
            content.innerHTML = this.criarVazioHTML();
        } else {
            content.innerHTML = this.criarFiltrosHTML() + this.criarListaVagasHTML(vagasFiltradas);
        }
        
        container.querySelector('.dashboard-card').appendChild(content);
        
        // Setup event listeners das vagas
        this.setupVagasEventListeners();
    }

    // Filtrar vagas conforme filtro atual
    filtrarVagas() {
        if (this.filtroAtual === 'todas') {
            return this.vagas;
        }
        return this.vagas.filter(vaga => vaga.status === this.filtroAtual);
    }

    // Criar HTML de loading
    criarLoadingHTML() {
        return `
            <div class="loading-container" style="text-align: center; padding: 3rem;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #1DB584; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 1rem; color: #666;">Carregando vagas...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    // Criar HTML quando não há vagas
    criarVazioHTML() {
        return `
            <div class="empty-state" style="text-align: center; padding: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                <h3>Nenhuma vaga encontrada</h3>
                <p style="color: #666; margin: 1rem 0;">Você ainda não publicou nenhuma vaga ou não há vagas que correspondam ao filtro selecionado.</p>
                <button class="btn" onclick="showSection('cadastrar')">+ Cadastrar Primeira Vaga</button>
            </div>
        `;
    }

    // Criar HTML dos filtros
    criarFiltrosHTML() {
        const totalVagas = this.vagas.length;
        const ativas = this.vagas.filter(v => v.status === 'ativa').length;
        const pausadas = this.vagas.filter(v => v.status === 'pausada').length;
        const expiradas = this.vagas.filter(v => v.status === 'expirada').length;

        return `
            <div class="filtros-vagas" style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
                <button class="filtro-vaga btn-filtro ${this.filtroAtual === 'todas' ? 'active' : ''}" data-filtro="todas">
                    Todas (${totalVagas})
                </button>
                <button class="filtro-vaga btn-filtro ${this.filtroAtual === 'ativa' ? 'active' : ''}" data-filtro="ativa">
                    Ativas (${ativas})
                </button>
                <button class="filtro-vaga btn-filtro ${this.filtroAtual === 'pausada' ? 'active' : ''}" data-filtro="pausada">
                    Pausadas (${pausadas})
                </button>
                <button class="filtro-vaga btn-filtro ${this.filtroAtual === 'expirada' ? 'active' : ''}" data-filtro="expirada">
                    Expiradas (${expiradas})
                </button>
            </div>
            <style>
                .btn-filtro {
                    padding: 0.5rem 1rem;
                    border: 2px solid #e0e0e0;
                    background: white;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }
                .btn-filtro:hover {
                    border-color: #1DB584;
                }
                .btn-filtro.active {
                    background: #1DB584;
                    color: white;
                    border-color: #1DB584;
                }
            </style>
        `;
    }

    // Criar HTML da lista de vagas
    criarListaVagasHTML(vagas) {
        return `
            <div class="vagas-lista">
                ${vagas.map(vaga => this.criarVagaCardHTML(vaga)).join('')}
            </div>
        `;
    }

    // Criar HTML de um card de vaga
    criarVagaCardHTML(vaga) {
        const statusClass = vaga.status === 'ativa' ? 'status-active' : 
                           vaga.status === 'pausada' ? 'status-paused' : 'status-expired';
        
        const statusText = vaga.status === 'ativa' ? 'Ativa' : 
                          vaga.status === 'pausada' ? 'Pausada' : 'Expirada';

        const dataFormatada = new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR');

        return `
            <div class="vaga-card" data-vaga-id="${vaga.id}">
                <div class="vaga-header">
                    <div>
                        <h3 class="vaga-title">${vaga.titulo}</h3>
                        <div class="vaga-meta">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <span>📅 ${dataFormatada}</span>
                            <span>💰 ${vaga.salario}</span>
                            <span>📍 ${vaga.localizacao}</span>
                        </div>
                    </div>
                    <div class="vaga-actions">
                        <button class="btn-action btn-candidatos" onclick="vagasManager.buscarCandidatos(${vaga.id})">
                            👥 Ver Candidatos (${vaga.candidatos || 0})
                        </button>
                        <button class="btn-action btn-editar" onclick="vagasManager.editarVaga(${vaga.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn-action btn-status" onclick="vagasManager.toggleStatusVaga(${vaga.id}, '${vaga.status}')">
                            ${vaga.status === 'ativa' ? '⏸️ Pausar' : '▶️ Ativar'}
                        </button>
                        <button class="btn-action btn-excluir" onclick="vagasManager.excluirVaga(${vaga.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
                
                <div class="vaga-info">
                    <p><strong>Tipo:</strong> ${vaga.tipoContrato} | <strong>Modalidade:</strong> ${vaga.modalidade}</p>
                    <p class="vaga-descricao">${vaga.descricao}</p>
                </div>
                
                <div class="vaga-stats">
                    <div class="stat-item">
                        <span class="stat-number">${vaga.candidatos || 0}</span>
                        <span class="stat-label">Candidatos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${vaga.visualizacoes || 0}</span>
                        <span class="stat-label">Visualizações</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup event listeners das vagas
    setupVagasEventListeners() {
        // Filtros
        document.querySelectorAll('.filtro-vaga').forEach(filtro => {
            filtro.addEventListener('click', (e) => {
                this.filtroAtual = e.target.dataset.filtro;
                this.atualizarFiltroAtivo(e.target);
                this.renderizarVagas();
            });
        });
    }

    // Atualizar filtro ativo
    atualizarFiltroAtivo(filtroAtivo) {
        document.querySelectorAll('.filtro-vaga').forEach(f => f.classList.remove('active'));
        filtroAtivo.classList.add('active');
    }

    // Toggle status da vaga
    async toggleStatusVaga(vagaId, statusAtual) {
        const novoStatus = statusAtual === 'ativa' ? 'pausada' : 'ativa';
        await this.alterarStatusVaga(vagaId, novoStatus);
    }

    // Editar vaga
    editarVaga(vagaId) {
        const vaga = this.vagas.find(v => v.id === vagaId);
        if (!vaga) return;

        // Preencher formulário com dados da vaga
        this.preencherFormularioEdicao(vaga);
        this.showSection('cadastrar');
    }

    // Preencher formulário para edição
    preencherFormularioEdicao(vaga) {
        const form = document.querySelector('#cadastrar');
        const inputs = form.querySelectorAll('.form-input, .form-textarea');
        
        inputs.forEach(input => {
            const label = input.previousElementSibling?.textContent?.toLowerCase() || '';
            
            if (label.includes('título')) input.value = vaga.titulo;
            else if (label.includes('contrato')) input.value = vaga.tipoContrato;
            else if (label.includes('modalidade')) input.value = vaga.modalidade;
            else if (label.includes('salário')) input.value = vaga.salario;
            else if (label.includes('localização')) input.value = vaga.localizacao;
            else if (label.includes('descrição')) input.value = vaga.descricao;
            else if (label.includes('requisitos')) input.value = vaga.requisitos;
        });

        // Alterar botão para "Atualizar Vaga"
        const btnPublicar = form.querySelector('.btn-next');
        if (btnPublicar) {
            btnPublicar.textContent = 'Atualizar Vaga';
            btnPublicar.dataset.vagaId = vaga.id;
        }
    }

    // Mostrar modal de candidatos
    mostrarModalCandidatos(vagaId, candidatos) {
        // Implementar modal de candidatos
        alert(`Candidatos da vaga ${vagaId}: ${candidatos.length} encontrados`);
    }

    // Atualizar estatísticas no dashboard
    atualizarEstatisticas() {
        const vagasAtivas = this.vagas.filter(v => v.status === 'ativa').length;
        const totalCandidatos = this.vagas.reduce((total, vaga) => total + (vaga.candidatos || 0), 0);
        const totalVisualizacoes = this.vagas.reduce((total, vaga) => total + (vaga.visualizacoes || 0), 0);

        // Atualizar card de estatísticas
        const statCard = document.querySelector('.stat-card .stat-number');
        if (statCard) {
            statCard.textContent = vagasAtivas;
        }

        // Você pode adicionar mais estatísticas aqui
    }

    // Controle de loading
    setLoading(loading) {
        this.loading = loading;
        
        // Mostrar/esconder indicador de loading global se existir
        const loadingIndicator = document.querySelector('.loading-global');
        if (loadingIndicator) {
            loadingIndicator.style.display = loading ? 'block' : 'none';
        }
    }

    // Mostrar mensagem de sucesso
    mostrarSucesso(mensagem) {
        this.mostrarNotificacao(mensagem, 'success');
    }

    // Mostrar mensagem de erro
    mostrarErro(mensagem) {
        this.mostrarNotificacao(mensagem, 'error');
    }

    // Sistema de notificações
    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remover notificação existente
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${mensagem}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            .notification-success { background: #d4edda; border-left: 4px solid #28a745; color: #155724; }
            .notification-error { background: #f8d7da; border-left: 4px solid #dc3545; color: #721c24; }
            .notification-info { background: #d1ecf1; border-left: 4px solid #17a2b8; color: #0c5460; }
            .notification-content { display: flex; justify-content: space-between; align-items: center; }
            .notification-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        
        if (!document.querySelector('style[data-notifications]')) {
            style.setAttribute('data-notifications', 'true');
            document.head.appendChild(style);
        }

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Event listener para fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Navegação entre seções
    showSection(sectionId) {
        // Remove active de todos os itens do menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Remove active de todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Adiciona active na seção selecionada
        document.getElementById(sectionId).classList.add('active');
        
        // Adiciona active no item do menu correspondente
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    }

    // Método para atualizar automaticamente as vagas
    iniciarAtualizacaoAutomatica(intervalo = 60000) { // 1 minuto
        setInterval(async () => {
            if (!this.loading) {
                await this.carregarVagasDoBackend();
                this.renderizarVagas();
                this.atualizarEstatisticas();
            }
        }, intervalo);
    }
}
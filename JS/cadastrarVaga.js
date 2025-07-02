// Script para cadastrar vaga - VERSÃO CORRIGIDA
class VagaCadastro {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080'; // Ajuste conforme sua configuração
        this.idEmpresa = localStorage.getItem('idEmpresa'); // ID da empresa logada
        this.initializeEventListeners();
        
        // Debug: verificar se o ID da empresa foi carregado
        console.log('ID da Empresa carregado:', this.idEmpresa);
        if (!this.idEmpresa) {
            console.warn('AVISO: ID da empresa não encontrado no localStorage');
        }
    }

    initializeEventListeners() {
        // Event listener para o botão "Publicar Vaga"
        const publicarBtn = document.querySelector('#cadastrar .btn-next');
        if (publicarBtn) {
            publicarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cadastrarVaga();
            });
        } else {
            console.warn('AVISO: Botão "Publicar Vaga" não encontrado');
        }

        // Event listener para validação em tempo real
        this.setupFormValidation();
        
        // Event listener para formatação do salário
        this.setupSalaryFormat();
    }

    setupFormValidation() {
        const form = document.querySelector('#cadastrar .form-container');
        if (!form) {
            console.warn('AVISO: Formulário não encontrado');
            return;
        }
        
        const inputs = form.querySelectorAll('.form-input, .form-textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    setupSalaryFormat() {
        const salarioInput = document.querySelector('#cadastrar input[placeholder="R$ 0,00"]');
        if (salarioInput) {
            salarioInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = (value / 100).toFixed(2);
                value = value.replace('.', ',');
                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                e.target.value = 'R$ ' + value;
            });
        }
    }

    validateField(field) {
        const isRequired = field.previousElementSibling && field.previousElementSibling.classList.contains('required');
        const isEmpty = !field.value.trim();
        
        if (isRequired && isEmpty) {
            this.showFieldError(field, 'Este campo é obrigatório');
            return false;
        }
        
        // Validações específicas
        if (field.placeholder === 'R$ 0,00') {
            const salarioValue = this.parseSalary(field.value);
            if (salarioValue <= 0) {
                this.showFieldError(field, 'Salário deve ser maior que zero');
                return false;
            }
        }
        
        this.clearFieldError(field);
        return true;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#e74c3c';
        
        // Remove erro anterior se existir
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Adiciona nova mensagem de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = '#e0e0e0';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    parseSalary(salaryString) {
        // Remove "R$", pontos e substitui vírgula por ponto
        return parseFloat(salaryString.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    }

    getFormData() {
        const form = document.querySelector('#cadastrar .form-container');
        if (!form) {
            console.error('ERRO: Formulário não encontrado');
            return null;
        }
        
        // Captura os valores dos campos com verificação de existência
        const tituloField = form.querySelector('input[placeholder*="Desenvolvedor"]');
        const tipoContratacaoField = form.querySelector('select');
        const modalidadeField = form.querySelectorAll('select')[1];
        const salarioField = form.querySelector('input[placeholder="R$ 0,00"]');
        const localizacaoField = form.querySelector('input[placeholder="Cidade, Estado"]');
        const descricaoField = form.querySelector('textarea[placeholder*="responsabilidades"]');
        const requisitosField = form.querySelector('textarea[placeholder*="requisitos"]');
        
        // Verificar se todos os campos foram encontrados
        const missingFields = [];
        if (!tituloField) missingFields.push('Título');
        if (!tipoContratacaoField) missingFields.push('Tipo de Contratação');
        if (!modalidadeField) missingFields.push('Modalidade');
        if (!salarioField) missingFields.push('Salário');
        if (!localizacaoField) missingFields.push('Localização');
        if (!descricaoField) missingFields.push('Descrição');
        if (!requisitosField) missingFields.push('Requisitos');
        
        if (missingFields.length > 0) {
            console.error('ERRO: Campos não encontrados:', missingFields);
            this.showErrorMessage(`Campos não encontrados no formulário: ${missingFields.join(', ')}`);
            return null;
        }
        
        const titulo = tituloField.value.trim();
        const tipoContratacao = tipoContratacaoField.value;
        const modalidade = modalidadeField.value;
        const salarioString = salarioField.value;
        const localizacao = localizacaoField.value.trim();
        const descricao = descricaoField.value.trim();
        const requisitos = requisitosField.value.trim();
        
        // Converte o salário para número
        const salario = this.parseSalary(salarioString);
        
        const data = {
            titulo,
            descricao,
            requisitos,
            salario,
            tipoContratacao,
            localizacao,
            modalidade,
            idEmpresa: parseInt(this.idEmpresa) // Garantir que seja um número
        };
        
        return data;
    }

    validateForm(data) {
        if (!data) return ['Erro ao capturar dados do formulário'];
        
        const errors = [];
        
        if (!data.titulo) errors.push('Título da vaga é obrigatório');
        if (!data.tipoContratacao) errors.push('Tipo de contratação é obrigatório');
        if (!data.modalidade) errors.push('Modalidade é obrigatória');
        if (!data.localizacao) errors.push('Localização é obrigatória');
        if (!data.descricao) errors.push('Descrição da vaga é obrigatória');
        if (!data.requisitos) errors.push('Requisitos são obrigatórios');
        if (data.salario <= 0) errors.push('Salário deve ser maior que zero');
        if (!data.idEmpresa || isNaN(data.idEmpresa)) errors.push('ID da empresa não encontrado ou inválido');
        
        return errors;
    }

    showLoadingState(button) {
        button.disabled = true;
        button.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></span> Publicando...';
        
        // Adiciona a animação de loading se não existir
        if (!document.querySelector('#loading-animation')) {
            const style = document.createElement('style');
            style.id = 'loading-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    hideLoadingState(button) {
        button.disabled = false;
        button.innerHTML = 'Publicar Vaga';
    }

    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        successDiv.innerHTML = `
            <strong>✓ Sucesso!</strong><br>
            Vaga cadastrada com sucesso!
        `;
        
        // Adiciona animação se não existir
        if (!document.querySelector('#success-animation')) {
            const style = document.createElement('style');
            style.id = 'success-animation';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(successDiv);
        
        // Remove a mensagem após 4 segundos
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 4000);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        errorDiv.innerHTML = `
            <strong>✗ Erro!</strong><br>
            ${message}
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    clearForm() {
        const form = document.querySelector('#cadastrar .form-container');
        if (!form) return;
        
        const inputs = form.querySelectorAll('.form-input');
        const textareas = form.querySelectorAll('.form-textarea');
        const selects = form.querySelectorAll('select');
        
        inputs.forEach(input => {
            input.value = '';
        });
        
        textareas.forEach(textarea => {
            textarea.value = '';
        });
        
        selects.forEach(select => {
            select.selectedIndex = 0;
        });
    }

    async cadastrarVaga() {
        try {
            console.log('Iniciando cadastro de vaga...');
            
            // Obtém os dados do formulário
            const vagaData = this.getFormData();
            if (!vagaData) {
                return; // Erro já foi mostrado no getFormData
            }
            
            // Valida os dados
            const errors = this.validateForm(vagaData);
            if (errors.length > 0) {
                console.error('Erros de validação:', errors);
                this.showErrorMessage(errors.join('<br>'));
                return;
            }
            
            // Mostra estado de carregamento
            const button = document.querySelector('#cadastrar .btn-next');
            this.showLoadingState(button);
            
            console.log('Enviando dados para:', `${this.apiBaseUrl}/vagas/cadastrar`);
            console.log('Dados enviados:', JSON.stringify(vagaData, null, 2));
            
            // Faz a requisição para a API
            const response = await fetch(`${this.apiBaseUrl}/vagas/cadastrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Adicione aqui headers de autenticação se necessário
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(vagaData)
            });
            
            console.log('Status da resposta:', response.status);
            console.log('Headers da resposta:', response.headers);
            
            // Verifica se a resposta tem conteúdo
            const contentType = response.headers.get('content-type');
            let result = null;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
                console.log('Resposta do servidor:', result);
            } else {
                const textResult = await response.text();
                console.log('Resposta do servidor (texto):', textResult);
                result = { message: textResult };
            }
            
            if (!response.ok) {
                const errorMessage = result?.message || result?.error || `Erro ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }
            
            // Sucesso
            console.log('Vaga cadastrada com sucesso!');
            this.showSuccessMessage();
            this.clearForm();
            
            // Redireciona para a seção "Minhas Vagas" após 2 segundos
            setTimeout(() => {
                if (typeof showSection === 'function') {
                    showSection('vagas');
                } else {
                    console.warn('Função showSection não encontrada');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao cadastrar vaga:', error);
            this.showErrorMessage(
                error.message.includes('Failed to fetch') 
                    ? 'Erro de conexão. Verifique sua internet e tente novamente.'
                    : error.message
            );
        } finally {
            // Remove estado de carregamento
            const button = document.querySelector('#cadastrar .btn-next');
            if (button) {
                this.hideLoadingState(button);
            }
        }
    }

    // Método para definir o ID da empresa
    setIdEmpresa(id) {
        this.idEmpresa = id;
        console.log('ID da empresa definido:', id);
    }
}

// Inicializa o sistema de cadastro quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando VagaCadastro...');
    
    // Cria uma instância global do cadastro de vagas
    window.vagaCadastro = new VagaCadastro();
    
    // Tenta obter o ID da empresa do localStorage
    const idEmpresa = localStorage.getItem('idEmpresa');
    if (idEmpresa) {
        window.vagaCadastro.setIdEmpresa(idEmpresa);
    } else {
        console.warn('ID da empresa não encontrado no localStorage');
    }
});

// Função auxiliar para definir o ID da empresa
function setEmpresaLogada(id) {
    console.log('Definindo empresa logada:', id);
    localStorage.setItem('idEmpresa', id);
    if (window.vagaCadastro) {
        window.vagaCadastro.setIdEmpresa(id);
    }
}
// dashboard_empresa.js

document.addEventListener('DOMContentLoaded', function() {
    // Carregar informações da empresa do localStorage
    carregarInformacoesEmpresa();
    
    // Verificar se o usuário está logado
    verificarLogin();
});

function verificarLogin() {
    const idEmpresa = localStorage.getItem('idEmpresa');
    
    if (!idEmpresa) {
        alert('Você precisa fazer login para acessar o dashboard.');
        window.location.href = 'login.html'; // Ajuste o caminho conforme necessário
        return;
    }
}

function carregarInformacoesEmpresa() {
    try {
        // Recuperar dados do localStorage
        const nomeEmpresa = localStorage.getItem('nomeEmpresa');
        const nomeResponsavel = localStorage.getItem('nomeResponsavel');
        const cnpjEmpresa = localStorage.getItem('cnpjEmpresa');
        const telEmpresa = localStorage.getItem('telEmpresa');
        const emailEmpresa = localStorage.getItem('emailEmpresa');
        
        // Atualizar nome da empresa no header (perfil do usuário)
        if (nomeResponsavel) {
            const userProfileSpan = document.querySelector('.user-profile span');
            if (userProfileSpan) {
                userProfileSpan.textContent = nomeResponsavel;
            }
        }
        
        // Atualizar informações no card da empresa
        if (nomeEmpresa) {
            const companyNameElement = document.querySelector('.company-details h3');
            if (companyNameElement) {
                companyNameElement.textContent = nomeEmpresa;
            }
        }
        
        if (cnpjEmpresa) {
            const cnpjElement = document.querySelector('.company-details p:first-of-type');
            if (cnpjElement) {
                cnpjElement.textContent = `CNPJ: ${formatarcnpj(cnpjEmpresa)}`;
            }
        }
        
        // Atualizar informações do responsável
        if (nomeResponsavel) {
            const responsavelElement = document.querySelector('.company-meta div:first-child');
            if (responsavelElement) {
                responsavelElement.innerHTML = `<strong>Responsável:</strong> ${nomeResponsavel}`;
            }
        }
        
        // Atualizar formulário de configurações da conta
        atualizarFormularioConfiguracao();
        
    } catch (error) {
        console.error('Erro ao carregar informações da empresa:', error);
    }
}

function atualizarFormularioConfiguracao() {
    const nomeEmpresa = localStorage.getItem('nomeEmpresa');
    const cnpjEmpresa = localStorage.getItem('cnpjEmpresa');
    const emailEmpresa = localStorage.getItem('emailEmpresa');
    const telEmpresa = localStorage.getItem('telEmpresa');
    const nomeResponsavel = localStorage.getItem('nomeResponsavel');
    
    // Atualizar campos do formulário na seção "Conta"
    const contaSection = document.getElementById('conta');
    
    if (contaSection) {
        // Nome da empresa
        const nomeEmpresaInput = contaSection.querySelector('input[value="SENAI CIMATEC"]');
        if (nomeEmpresaInput && nomeEmpresa) {
            nomeEmpresaInput.value = nomeEmpresa;
        }
        
        // CNPJ
        const cnpjInput = contaSection.querySelector('input[value="00.000.000/0000-00"]');
        if (cnpjInput && cnpjEmpresa) {
            cnpjInput.value = formatarcnpj(cnpjEmpresa);
        }
        
        // Email
        const emailInput = contaSection.querySelector('input[value="contato@senai.com"]');
        if (emailInput && emailEmpresa) {
            emailInput.value = emailEmpresa;
        }
        
        // Telefone
        const telefoneInput = contaSection.querySelector('input[value="(11) 99999-9999"]');
        if (telefoneInput && telEmpresa) {
            telefoneInput.value = formatarTelefone(telEmpresa);
        }
        
        // Responsável
        const responsavelInput = contaSection.querySelector('input[value="Nicolas Gonzaga"]');
        if (responsavelInput && nomeResponsavel) {
            responsavelInput.value = nomeResponsavel;
        }
    }
}

// Funções utilitárias para formatação
function formatarcnpj(cnpj) {
    if (!cnpj) return '';
    
    // Remove caracteres não numéricos
    const numeros = cnpj.replace(/\D/g, '');
    
    // Se tem 11 dígitos, é cnpj
    if (numeros.length === 11) {
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    // Se tem 14 dígitos, é CNPJ
    else if (numeros.length === 14) {
        return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpj; // Retorna original se não conseguir formatar
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Formato: (11) 99999-9999
    if (numeros.length === 11) {
        return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    // Formato: (11) 9999-9999
    else if (numeros.length === 10) {
        return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone; // Retorna original se não conseguir formatar
}

// Função para logout
function logout() {
    // Limpar localStorage
    localStorage.removeItem('idEmpresa');
    localStorage.removeItem('nomeEmpresa');
    localStorage.removeItem('nomeResponsavel');
    localStorage.removeItem('cnpjEmpresa');
    localStorage.removeItem('telEmpresa');
    localStorage.removeItem('emailEmpresa');
    
    // Redirecionar para página de login
    window.location.href = 'login.html'; // Ajuste o caminho conforme necessário
}

// Função para atualizar dados da empresa
function atualizarDadosEmpresa(novosDados) {
    // Atualizar localStorage com novos dados
    if (novosDados.nomeEmpresa) {
        localStorage.setItem('nomeEmpresa', novosDados.nomeEmpresa);
    }
    if (novosDados.cnpj) {
        localStorage.setItem('cnpjEmpresa', novosDados.cnpj);
    }
    if (novosDados.email) {
        localStorage.setItem('emailEmpresa', novosDados.email);
    }
    if (novosDados.telefone) {
        localStorage.setItem('telEmpresa', novosDados.telefone);
    }
    if (novosDados.nomeResponsavel) {
        localStorage.setItem('nomeResponsavel', novosDados.nomeResponsavel);
    }
    
    // Recarregar informações na tela
    carregarInformacoesEmpresa();
}

// Adicionar evento de clique para logout (se houver botão)
document.addEventListener('DOMContentLoaded', function() {
    // Procurar por botão de logout ou adicionar funcionalidade ao dropdown
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        // Adicionar menu dropdown com opção de logout
        userProfile.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Criar menu dropdown se não existir
            let dropdown = userProfile.querySelector('.dropdown-menu');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'dropdown-menu';
                dropdown.style.cssText = `
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    min-width: 150px;
                    z-index: 1000;
                    display: none;
                `;
                
                const logoutBtn = document.createElement('button');
                logoutBtn.textContent = 'Sair';
                logoutBtn.style.cssText = `
                    width: 100%;
                    padding: 10px 15px;
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    color: #e74c3c;
                `;
                logoutBtn.addEventListener('click', logout);
                
                dropdown.appendChild(logoutBtn);
                userProfile.style.position = 'relative';
                userProfile.appendChild(dropdown);
            }
            
            // Toggle dropdown
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        const dropdown = document.querySelector('.dropdown-menu');
        const userProfile = document.querySelector('.user-profile');
        
        if (dropdown && !userProfile.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// Função para debug - mostrar dados do localStorage no console
function mostrarDadosLocalStorage() {
    console.log('Dados da empresa no localStorage:');
    console.log('ID:', localStorage.getItem('idEmpresa'));
    console.log('Nome da Empresa:', localStorage.getItem('nomeEmpresa'));
    console.log('Nome do Responsável:', localStorage.getItem('nomeResponsavel'));
    console.log('CNPJ:', localStorage.getItem('cnpjEmpresa'));
    console.log('Telefone:', localStorage.getItem('telEmpresa'));
    console.log('Email:', localStorage.getItem('emailEmpresa'));
}

// Exportar funções para uso global (se necessário)
window.carregarInformacoesEmpresa = carregarInformacoesEmpresa;
window.logout = logout;
window.atualizarDadosEmpresa = atualizarDadosEmpresa;
window.mostrarDadosLocalStorage = mostrarDadosLocalStorage;
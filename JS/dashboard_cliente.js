// ===== CONFIGURAÇÕES DA API =====
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080', // Ajuste conforme seu backend
    ENDPOINTS: {
        CANDIDATO: '/candidatos',
        ENDERECO: '/enderecos'
    }
};

// ===== KEYS DO LOCALSTORAGE =====
const STORAGE_KEYS = {
    CANDIDATO: 'candidato_completo',
    ENDERECO: 'endereco_candidato'
};

// ===== CONTROLE DE AUTO-SAVE =====
let autoSaveEnabled = false;
let isInitialLoad = true;

// Funções para aplicar máscaras
function aplicarMascaraCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return cpf;
}

function aplicarMascaraTelefone(telefone) {
    telefone = telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (telefone.length <= 10) {
        // Telefone fixo: (99) 9999-9999
        telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
        telefone = telefone.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        // Celular: (99) 99999-9999
        telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
        telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return telefone;
}

function aplicarMascaraCEP(cep) {
    cep = cep.replace(/\D/g, ''); // Remove caracteres não numéricos
    cep = cep.replace(/(\d{5})(\d)/, '$1-$2');
    return cep;
}

// Funções para remover máscaras (apenas números)
function removerMascaraCPF(cpf) {
    return cpf.replace(/\D/g, '');
}

function removerMascaraTelefone(telefone) {
    return telefone.replace(/\D/g, '');
}

function removerMascaraCEP(cep) {
    return cep.replace(/\D/g, '');
}


// Função para buscar endereço pelo CEP - VERSÃO CORRIGIDA
async function buscarEnderecoPorCEP(cep) {
    const cepLimpo = removerMascaraCEP(cep);
    console.log('Buscando CEP:', cepLimpo);

    // Validar se o CEP tem 8 dígitos
    if (cepLimpo.length !== 8) {
        console.log('CEP inválido - deve ter 8 dígitos');
        return { erro: 'CEP deve ter 8 dígitos' };
    }

    try {
        // Mostrar loading
        mostrarLoadingCEP(true);

        const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
        console.log('URL da requisição:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta da API:', data);

        // Esconder loading
        mostrarLoadingCEP(false);

        if (data.erro) {
            console.log('CEP não encontrado na API');
            return { erro: 'CEP não encontrado' };
        }

        // Salvar dados do endereço no localStorage
        salvarEnderecoLocalStorage(data, cepLimpo);

        return data;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        mostrarLoadingCEP(false);
        return { erro: 'Erro ao buscar CEP. Verifique sua conexão.' };
    }
}

// ===== NOVA FUNÇÃO: SALVAR ENDEREÇO NO LOCALSTORAGE =====
function salvarEnderecoLocalStorage(dadosCEP, cepLimpo) {
    // Capturar campos de endereço adicionais
    const numeroInput = Array.from(document.querySelectorAll('#curriculo input')).find(input => {
        const label = input.parentElement?.querySelector('label');
        return label && label.textContent.toLowerCase().includes('número');
    });

    const complementoInput = Array.from(document.querySelectorAll('#curriculo input')).find(input => {
        const label = input.parentElement?.querySelector('label');
        return label && label.textContent.toLowerCase().includes('complemento');
    });

    const enderecoData = {
        cep: cepLimpo,
        logradouro: dadosCEP.logradouro || '',
        numero: numeroInput ? numeroInput.value : '',
        complemento: complementoInput ? complementoInput.value : '',
        bairro: dadosCEP.bairro || '',
        cidade: dadosCEP.localidade || '',
        estado: dadosCEP.uf || '',
        dataAtualizacao: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.ENDERECO, JSON.stringify(enderecoData));
    console.log('Endereço salvo no localStorage:', enderecoData);
}

// Função para mostrar/esconder loading do CEP
function mostrarLoadingCEP(mostrar) {
    let loadingElement = document.getElementById('cep-loading');

    if (mostrar && !loadingElement) {
        // Buscar o input do CEP de forma mais robusta
        let cepInput = document.querySelector('#curriculo input[placeholder*="CEP"]');

        if (!cepInput) {
            const labels = document.querySelectorAll('#curriculo .form-label');
            labels.forEach(label => {
                if (label.textContent.toLowerCase().includes('cep')) {
                    const formGroup = label.closest('.form-group');
                    cepInput = formGroup ? formGroup.querySelector('input') : null;
                }
            });
        }

        if (cepInput) {
            loadingElement = document.createElement('span');
            loadingElement.id = 'cep-loading';
            loadingElement.textContent = ' Buscando...';
            loadingElement.style.color = '#666';
            loadingElement.style.fontSize = '12px';
            cepInput.parentNode.appendChild(loadingElement);
        }
    } else if (!mostrar && loadingElement) {
        loadingElement.remove();
    }
}

// Função para preencher campos de endereço - VERSÃO CORRIGIDA
function preencherEndereco(dados) {
    console.log('Dados recebidos da API:', dados);

    // Método 1: Buscar por placeholder
    let cidadeInput = document.querySelector('#curriculo input[placeholder*="Cidade"]');
    let estadoInput = document.querySelector('#curriculo input[placeholder*="Estado"]');
    let ruaInput = document.querySelector('#curriculo input[placeholder*="Rua"]');

    // Método 2: Buscar pelos labels (mais confiável)
    const labels = document.querySelectorAll('#curriculo .form-label');
    let cidadeField, estadoField, ruaField;

    labels.forEach(label => {
        const text = label.textContent.toLowerCase().trim();
        // Buscar o input dentro do mesmo form-group
        const formGroup = label.closest('.form-group');
        const input = formGroup ? formGroup.querySelector('input') : null;

        console.log('Label encontrado:', text, 'Input:', input);

        if (text.includes('cidade') && input) {
            cidadeField = input;
        } else if (text.includes('estado') && input) {
            estadoField = input;
        } else if (text.includes('rua') && input) {
            ruaField = input;
        }
    });

    // Método 3: Buscar por posição (baseado na estrutura do HTML)
    if (!cidadeField || !estadoField || !ruaField) {
        const formRows = document.querySelectorAll('#curriculo .form-row');
        formRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const labels = row.querySelectorAll('.form-label');

            labels.forEach((label, index) => {
                const text = label.textContent.toLowerCase().trim();
                const input = inputs[index];

                if (text.includes('cidade') && input && !cidadeField) {
                    cidadeField = input;
                } else if (text.includes('estado') && input && !estadoField) {
                    estadoField = input;
                } else if (text.includes('rua') && input && !ruaField) {
                    ruaField = input;
                }
            });
        });
    }

    // Usar os campos encontrados pelos métodos anteriores
    if (!cidadeField) cidadeField = cidadeInput;
    if (!estadoField) estadoField = estadoInput;
    if (!ruaField) ruaField = ruaInput;

    console.log('Campos encontrados:', {
        cidade: cidadeField,
        estado: estadoField,
        rua: ruaField
    });

    // Preencher os campos encontrados
    if (cidadeField && dados.localidade) {
        cidadeField.value = dados.localidade;
        cidadeField.readOnly = true;
        cidadeField.style.backgroundColor = '#f5f5f5';
        console.log('Cidade preenchida:', dados.localidade);
    }

    if (estadoField && dados.uf) {
        estadoField.value = dados.uf;
        estadoField.readOnly = true;
        estadoField.style.backgroundColor = '#f5f5f5';
        console.log('Estado preenchido:', dados.uf);
    }

    if (ruaField && dados.logradouro) {
        ruaField.value = dados.logradouro;
        ruaField.readOnly = true;
        ruaField.style.backgroundColor = '#f5f5f5';
        console.log('Rua preenchida:', dados.logradouro);
    }

    // Se ainda não encontrou os campos, tentar uma abordagem mais genérica
    if (!cidadeField && !estadoField && !ruaField) {
        console.log('Tentando método alternativo...');
        const allInputs = document.querySelectorAll('#curriculo input[type="text"]');

        allInputs.forEach((input, index) => {
            const label = input.closest('.form-group')?.querySelector('.form-label');
            if (label) {
                const labelText = label.textContent.toLowerCase().trim();
                console.log(`Input ${index}: ${labelText}`);

                if (labelText.includes('cidade') && dados.localidade) {
                    input.value = dados.localidade;
                    input.readOnly = true;
                    input.style.backgroundColor = '#f5f5f5';
                    console.log('Cidade preenchida (método alternativo):', dados.localidade);
                } else if (labelText.includes('estado') && dados.uf) {
                    input.value = dados.uf;
                    input.readOnly = true;
                    input.style.backgroundColor = '#f5f5f5';
                    console.log('Estado preenchido (método alternativo):', dados.uf);
                } else if (labelText.includes('rua') && dados.logradouro) {
                    input.value = dados.logradouro;
                    input.readOnly = true;
                    input.style.backgroundColor = '#f5f5f5';
                    console.log('Rua preenchida (método alternativo):', dados.logradouro);
                }
            }
        });
    }
}

// Função para limpar campos de endereço - VERSÃO CORRIGIDA
function limparCamposEndereco() {
    console.log('Limpando campos de endereço...');

    const labels = document.querySelectorAll('#curriculo .form-label');

    labels.forEach(label => {
        const text = label.textContent.toLowerCase().trim();
        const formGroup = label.closest('.form-group');
        const input = formGroup ? formGroup.querySelector('input') : null;

        if ((text.includes('cidade') || text.includes('estado') || text.includes('rua')) && input) {
            input.value = '';
            input.readOnly = false;
            input.style.backgroundColor = '';
            console.log('Campo limpo:', text);
        }
    });

    // Limpar endereço do localStorage
    localStorage.removeItem(STORAGE_KEYS.ENDERECO);
}

// ===== NOVA FUNÇÃO: COLETAR TODOS OS DADOS DO FORMULÁRIO =====
function coletarTodosDadosFormulario() {
    console.log('Coletando todos os dados do formulário...');

    // Dados pessoais básicos
    const nomeElement = document.querySelector('#curriculo h3');
    const cpfElement = document.querySelector('#curriculo input[placeholder="000.000.000-00"]');
    const telefoneElement = document.querySelector('#curriculo input[placeholder="(99) 99999-9999"]');
    const emailElement = document.querySelector('#curriculo input[placeholder="seuemail@gmail.com"]');

    // Buscar outros campos por labels
    const inputs = document.querySelectorAll('#curriculo input, #curriculo select');
    const dadosCompletos = {
        // Dados básicos
        nome: nomeElement ? nomeElement.textContent.trim() : '',
        cpf: cpfElement ? removerMascaraCPF(cpfElement.value) : '',
        telefone: telefoneElement ? removerMascaraTelefone(telefoneElement.value) : '',
        email: emailElement ? emailElement.value.trim() : ''
    };

    // Coletar outros campos dinamicamente
    inputs.forEach(input => {
        const label = input.parentElement?.querySelector('label');
        if (label) {
            const labelText = label.textContent.toLowerCase().trim().replace(':', '');
            const fieldName = labelText
                .replace(/\s+/g, '_')
                .replace('data_de_nascimento', 'dataNascimento')
                .replace('estado_civil', 'estadoCivil')
                .replace('nome_da_mãe', 'nomeMae')
                .replace('mãe', 'nomeMae')
                .replace('nome_do_pai', 'nomePai')
                .replace('pai', 'nomePai')
                .replace('gênero', 'genero');

            if (!['nome', 'cpf', 'telefone', 'email'].includes(fieldName)) {
                if (input.type === 'file') {
                    // Para arquivos, capturar o nome do arquivo
                    dadosCompletos[fieldName] = input.files.length > 0 ? input.files[0].name : '';
                } else {
                    dadosCompletos[fieldName] = input.value.trim();
                }
            }
        }
    });

    console.log('Dados coletados:', dadosCompletos);
    return dadosCompletos;
}

// ===== NOVA FUNÇÃO: COLETAR DADOS DO ENDEREÇO =====
function coletarDadosEndereco() {
    console.log('Coletando dados do endereço...');

    const enderecoInputs = {};
    const labels = document.querySelectorAll('#curriculo .form-label');

    labels.forEach(label => {
        const text = label.textContent.toLowerCase().trim();
        const formGroup = label.closest('.form-group');
        const input = formGroup ? formGroup.querySelector('input') : null;

        if (input) {
            if (text.includes('cep')) {
                enderecoInputs.cep = removerMascaraCEP(input.value);
            } else if (text.includes('cidade')) {
                enderecoInputs.cidade = input.value.trim();
            } else if (text.includes('estado')) {
                enderecoInputs.estado = input.value.trim();
            } else if (text.includes('rua')) {
                enderecoInputs.logradouro = input.value.trim();
            } else if (text.includes('número')) {
                enderecoInputs.numero = input.value.trim();
            } else if (text.includes('complemento')) {
                enderecoInputs.complemento = input.value.trim();
            }
        }
    });

    console.log('Dados do endereço coletados:', enderecoInputs);
    return enderecoInputs;
}

async function salvarPerfil(event) {
    event.preventDefault();

    const idCandidato = localStorage.getItem('idCandidato');
    if (!idCandidato) {
        alert('Erro: ID do cliente não encontrado. Faça login novamente.');
        return;
    }

    // Verificar se o usuário quer alterar a senha
    const senhaAtual = document.getElementById('senha-atual').value.trim();
    const novaSenha = document.getElementById('nova-senha').value.trim();
    const confirmarSenha = document.getElementById('confirmar-senha').value.trim();

    // Se algum campo de senha foi preenchido, validar todos
    if (senhaAtual || novaSenha || confirmarSenha) {
        if (!senhaAtual) {
            alert('Para alterar a senha, você deve informar a senha atual.');
            return;
        }
        if (!novaSenha) {
            alert('Digite a nova senha.');
            return;
        }
        if (novaSenha !== confirmarSenha) {
            alert('A confirmação da senha não confere.');
            return;
        }
        if (novaSenha.length < 6) {
            alert('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
    }

    // Validações básicas dos dados obrigatórios
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefoneFormatado = document.getElementById('telefone').value.trim();
    
    // CONVERTER TELEFONE PARA APENAS NÚMEROS
    const telefone = obterTelefoneLimpo(telefoneFormatado);

    if (!nome || !email || !telefone) {
        alert('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Telefone).');
        return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
    }

    if (telefone.length < 10 || telefone.length > 11) {
        alert('Por favor, insira um telefone válido.');
        return;
    }

    try {
        const botaoSalvar = document.querySelector('#profile-form button[type="submit"]');
        const textoOriginal = botaoSalvar.innerHTML;
        botaoSalvar.innerHTML = 'Salvando...';
        botaoSalvar.disabled = true;

        console.log('Buscando dados atuais do cliente...');
        const responseAtual = await fetch(`http://localhost:8080/cliente/buscar/${idCliente}`);

        let clienteAtual = {};
        if (responseAtual.ok) {
            const responseText = await responseAtual.text();
            if (responseText.trim()) {
                try {
                    clienteAtual = JSON.parse(responseText);
                    console.log('Dados atuais encontrados:', { ...clienteAtual, senha: '[OCULTA]' });
                } catch (e) {
                    console.warn('Erro ao fazer parse dos dados atuais:', e);
                }
            }
        } else {
            console.warn('Não foi possível buscar dados atuais do cliente');
        }

        const dadosEndereco = {
            idCliente: parseInt(idCliente),
            cep: document.getElementById('cep').value.replace(/\D/g, ''),
            logradouro: document.getElementById('rua').value.trim(),
            bairro: document.getElementById('bairro').value.trim(),
            numero: document.getElementById('numero').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            complemento: document.getElementById('complemento').value.trim()
        };

        let idEnderecoCliente = clienteAtual.idEnderecoCliente || null;

        if (dadosEndereco.cep || dadosEndereco.logradouro) {
            console.log('Criando/atualizando endereço:', dadosEndereco);

            const responseEndereco = await fetch('http://localhost:8080/endereco-cliente/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosEndereco)
            });

            if (!responseEndereco.ok) {
                let errorMessage = `Erro ao salvar endereço: ${responseEndereco.status}`;
                try {
                    const errorData = await responseEndereco.json();
                    errorMessage = `Erro ao salvar endereço: ${errorData.message || responseEndereco.status}`;
                } catch (e) {
                    console.warn('Erro ao fazer parse do JSON de erro do endereço:', e);
                }
                throw new Error(errorMessage);
            }

            const responseEnderecoText = await responseEndereco.text();
            if (responseEnderecoText.trim()) {
                try {
                    const resultadoEndereco = JSON.parse(responseEnderecoText);
                    idEnderecoCliente = resultadoEndereco.idEnderecoCliente || resultadoEndereco.id || idEnderecoCliente;
                } catch (e) {
                    console.warn('Resposta do endereço não é um JSON válido:', responseEnderecoText);
                }
            }
            console.log('Endereço processado com ID:', idEnderecoCliente);
        }

        const cpfFormatado = document.getElementById('cpf').value.trim();
        const cpfLimpo = obterCPFLimpo(cpfFormatado); 

        const dadosCliente = {
            idCliente: parseInt(idCliente),
            nome: nome,
            email: email,
            telefone: telefone, 
            cpf: cpfLimpo,
            senha: novaSenha || clienteAtual.senha || undefined
        };

        if (idEnderecoCliente) {
            dadosCliente.idEnderecoCliente = idEnderecoCliente;
        }

        Object.keys(dadosCliente).forEach(key => {
            if (dadosCliente[key] === undefined) {
                delete dadosCliente[key];
            }
        });

        console.log('Dados do cliente a serem enviados:', { ...dadosCliente, senha: '[OCULTA]' });

        const responseCliente = await fetch('http://localhost:8080/cliente/cadastrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosCliente)
        });

        if (!responseCliente.ok) {
            let errorMessage = `Erro HTTP: ${responseCliente.status}`;
            try {
                const errorData = await responseCliente.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                console.warn('Erro ao fazer parse do JSON de erro do cliente:', e);
            }
            throw new Error(errorMessage);
        }

        const responseClienteText = await responseCliente.text();
        let resultadoCliente = {};

        if (responseClienteText.trim()) {
            try {
                resultadoCliente = JSON.parse(responseClienteText);
            } catch (e) {
                console.warn('Resposta do cliente não é um JSON válido:', responseClienteText);
                resultadoCliente = { message: 'Cliente atualizado com sucesso' };
            }
        } else {
            resultadoCliente = { message: 'Cliente atualizado com sucesso' };
        }

        console.log('Cliente atualizado com sucesso');

        localStorage.setItem('nomeCliente', dadosCliente.nome);
        localStorage.setItem('emailCliente', dadosCliente.email);
        localStorage.setItem('telCliente', dadosCliente.telefone);
        localStorage.setItem('cpfCliente', dadosCliente.cpf); 
        localStorage.setItem('cepCliente', dadosEndereco.cep);
        localStorage.setItem('bairroCliente', dadosEndereco.bairro);
        localStorage.setItem('cidadeCliente', dadosEndereco.cidade);
        localStorage.setItem('ruaCliente', dadosEndereco.logradouro);
        localStorage.setItem('numeroCliente', dadosEndereco.numero);
        localStorage.setItem('complementoCliente', dadosEndereco.complemento);

        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirmar-senha').value = '';

        alert('Perfil atualizado com sucesso!');

        botaoSalvar.innerHTML = textoOriginal;
        botaoSalvar.disabled = false;

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar perfil: ' + error.message);

        const botaoSalvar = document.querySelector('#profile-form button[type="submit"]');
        botaoSalvar.innerHTML = 'Salvar Alterações';
        botaoSalvar.disabled = false;
    }
}

// ===== NOVA FUNÇÃO: SALVAR APENAS NO LOCALSTORAGE =====
function salvarApenasLocalStorage() {
    try {
        const dadosCandidato = coletarTodosDadosFormulario();
        const dadosEndereco = coletarDadosEndereco();

        // Salvar candidato
        localStorage.setItem(STORAGE_KEYS.CANDIDATO, JSON.stringify({
            ...dadosCandidato,
            dataAtualizacao: new Date().toISOString()
        }));

        // Salvar endereço se existir
        if (dadosEndereco.cep || dadosEndereco.cidade) {
            localStorage.setItem(STORAGE_KEYS.ENDERECO, JSON.stringify({
                ...dadosEndereco,
                dataAtualizacao: new Date().toISOString()
            }));
        }

        // Atualizar interface
        atualizarStatusCurriculo();

        console.log('Dados salvos apenas no localStorage');

    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

// ===== NOVA FUNÇÃO: ATUALIZAR STATUS DO CURRÍCULO =====
function atualizarStatusCurriculo() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEYS.CANDIDATO);
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);

        // Calcular porcentagem de preenchimento
        const camposObrigatorios = ['nome', 'cpf', 'email', 'telefone'];
        const camposPreenchidos = camposObrigatorios.filter(campo => dados[campo] && dados[campo].trim() !== '');
        const porcentagem = Math.round((camposPreenchidos.length / camposObrigatorios.length) * 100);

        // Atualizar na interface
        const statusElement = document.querySelector('.status-card .status-value');
        if (statusElement && statusElement.textContent.includes('preenchido')) {
            statusElement.textContent = `${porcentagem}% preenchido`;
        }

        console.log(`Status do currículo atualizado: ${porcentagem}%`);
    }
}

// Função para carregar dados do localStorage
function carregarDadosLocalStorage() {
    // Carregar dados do candidato completo
    const candidatoSalvo = localStorage.getItem(STORAGE_KEYS.CANDIDATO);
    let dadosCandidato = {};

    if (candidatoSalvo) {
        dadosCandidato = JSON.parse(candidatoSalvo);
        console.log('Dados completos carregados:', dadosCandidato);
    } else {
        // Buscar dados antigos para compatibilidade
        const nome = localStorage.getItem('nomeCandidato') || localStorage.getItem('nome');
        const email = localStorage.getItem('emailCandidato') || localStorage.getItem('email');
        const cpf = localStorage.getItem('cpfCandidato') || localStorage.getItem('cpf');
        const telefone = localStorage.getItem('telCandidato') || localStorage.getItem('telefone');

        dadosCandidato = { nome, email, cpf, telefone };
        console.log('Dados antigos carregados:', dadosCandidato);
    }

    // Carregar dados do endereço
    const enderecoSalvo = localStorage.getItem(STORAGE_KEYS.ENDERECO);
    let dadosEndereco = {};

    if (enderecoSalvo) {
        dadosEndereco = JSON.parse(enderecoSalvo);
        console.log('Dados do endereço carregados:', dadosEndereco);
    }

    // Atualizar nome no header
    const headerUsername = document.querySelector('.user-profile span');
    if (headerUsername && dadosCandidato.nome) {
        headerUsername.textContent = dadosCandidato.nome;
    }

    // Atualizar nome na seção currículo
    const curriculoUsername = document.querySelector('#curriculo h3');
    if (curriculoUsername && dadosCandidato.nome) {
        curriculoUsername.textContent = dadosCandidato.nome;
    }

    // Preencher campos do currículo com máscaras aplicadas
    const cpfInput = document.querySelector('#curriculo input[placeholder="000.000.000-00"]');
    if (cpfInput && dadosCandidato.cpf) {
        cpfInput.value = aplicarMascaraCPF(dadosCandidato.cpf);
    }

    const telefoneInput = document.querySelector('#curriculo input[placeholder="(99) 99999-9999"]');
    if (telefoneInput && dadosCandidato.telefone) {
        telefoneInput.value = aplicarMascaraTelefone(dadosCandidato.telefone);
    }

    const emailCurriculoInput = document.querySelector('#curriculo input[placeholder="seuemail@gmail.com"]');
    if (emailCurriculoInput && dadosCandidato.email) {
        emailCurriculoInput.value = dadosCandidato.email;
    }

    // Preencher campos da seção conta
    const emailContaInput = document.querySelector('#conta input[type="email"]');
    if (emailContaInput && dadosCandidato.email) {
        emailContaInput.value = dadosCandidato.email;
    }

    // Preencher campos de endereço se existirem
    if (dadosEndereco.cep) {
        const cepInput = Array.from(document.querySelectorAll('#curriculo input')).find(input => {
            const label = input.parentElement?.querySelector('label');
            return label && label.textContent.toLowerCase().includes('cep');
        });
        if (cepInput) {
            cepInput.value = aplicarMascaraCEP(dadosEndereco.cep);
        }
    }

    // Atualizar status do currículo
    atualizarStatusCurriculo();
}

// Função para salvar alterações no localStorage - ATUALIZADA
function salvarAlteracoes() {
    try {
        // Usar a nova função para salvar completo com forçar salvamento
        salvarCandidatoCompleto(true);

    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        alert('Erro ao salvar dados. Tente novamente.');
    }
}

// Função para salvar alterações da conta
function salvarContaAlteracoes() {
    try {
        const emailElement = document.querySelector('#conta input[type="email"]');
        const senhaAtualElement = document.querySelector('#conta input[type="password"]:nth-of-type(1)');
        const novaSenhaElement = document.querySelector('#conta input[type="password"]:nth-of-type(2)');
        const confirmarSenhaElement = document.querySelector('#conta input[type="password"]:nth-of-type(3)');

        const email = emailElement ? emailElement.value : '';
        const senhaAtual = senhaAtualElement ? senhaAtualElement.value : '';
        const novaSenha = novaSenhaElement ? novaSenhaElement.value : '';
        const confirmarSenha = confirmarSenhaElement ? confirmarSenhaElement.value : '';

        // Validar senha atual (opcional - você pode adicionar validação mais robusta)
        const senhaArmazenada = localStorage.getItem('senha') || localStorage.getItem('password');

        if (senhaAtual && senhaArmazenada && senhaAtual !== senhaArmazenada) {
            alert('Senha atual incorreta!');
            return;
        }

        // Validar nova senha
        if (novaSenha && novaSenha !== confirmarSenha) {
            alert('Nova senha e confirmação não coincidem!');
            return;
        }

        // Salvar email atualizado
        if (email) {
            // Atualizar nos dados completos
            const dadosCompletos = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATO) || '{}');
            dadosCompletos.email = email;
            dadosCompletos.dataAtualizacao = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.CANDIDATO, JSON.stringify(dadosCompletos));

            // Manter compatibilidade com sistema antigo
            localStorage.setItem('emailCandidato', email);
            localStorage.setItem('email', email);
        }

        // Salvar nova senha se fornecida
        if (novaSenha) {
            localStorage.setItem('senha', novaSenha);
            localStorage.setItem('password', novaSenha);
        }

        alert('Dados da conta atualizados com sucesso!');

        // Limpar campos de senha por segurança
        if (senhaAtualElement) senhaAtualElement.value = '';
        if (novaSenhaElement) novaSenhaElement.value = '';
        if (confirmarSenhaElement) confirmarSenhaElement.value = '';

    } catch (error) {
        console.error('Erro ao salvar dados da conta:', error);
        alert('Erro ao salvar dados da conta. Tente novamente.');
    }
}

// ===== FUNÇÃO PARA CONFIGURAR AUTO-SAVE =====
function configurarAutoSave() {
    const inputs = document.querySelectorAll('#curriculo input, #curriculo select, #curriculo textarea');

    inputs.forEach(input => {
        // Salvar quando o usuário sair do campo (blur)
        input.addEventListener('blur', () => {
            if (autoSaveEnabled && !isInitialLoad) {
                console.log('Auto-save ativado para:', input.name || input.placeholder);
                salvarCandidatoCompleto();
            }
        });

        // Para inputs de texto, salvar com delay após parar de digitar
        if (input.type === 'text' || input.type === 'email' || input.tagName === 'TEXTAREA') {
            let timeoutId;
            input.addEventListener('input', () => {
                if (autoSaveEnabled && !isInitialLoad) {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        console.log('Auto-save com delay para:', input.name || input.placeholder);
                        salvarCandidatoCompleto();
                    }, 2000); // 2 segundos após parar de digitar
                }
            });
        }
    });
}

// ===== FUNÇÃO PARA APLICAR MÁSCARAS EM TEMPO REAL =====
function configurarMascaras() {
    // Máscara para CPF
    const cpfInputs = document.querySelectorAll('#curriculo input[placeholder*="000.000.000-00"]');
    cpfInputs.forEach(input => {
        input.addEventListener('input', function () {
            this.value = aplicarMascaraCPF(this.value);
        });
    });

    // Máscara para telefone
    const telefoneInputs = document.querySelectorAll('#curriculo input[placeholder*="99999-9999"]');
    telefoneInputs.forEach(input => {
        input.addEventListener('input', function () {
            this.value = aplicarMascaraTelefone(this.value);
        });
    });

    // Máscara para CEP
    const cepInputs = document.querySelectorAll('#curriculo input');
    cepInputs.forEach(input => {
        const label = input.parentElement?.querySelector('label');
        if (label && label.textContent.toLowerCase().includes('cep')) {
            input.addEventListener('input', function () {
                this.value = aplicarMascaraCEP(this.value);
            });

            // Buscar endereço quando CEP for preenchido completamente
            input.addEventListener('blur', async function () {
                const cepLimpo = removerMascaraCEP(this.value);
                if (cepLimpo.length === 8) {
                    const dados = await buscarEnderecoPorCEP(this.value);
                    if (!dados.erro) {
                        preencherEndereco(dados);
                    } else {
                        console.log('Erro ao buscar CEP:', dados.erro);
                        // Limpar campos se CEP inválido
                        limparCamposEndereco();
                    }
                }
            });
        }
    });
}

// ===== FUNÇÃO PARA CONFIGURAR BOTÕES =====
function configurarBotoes() {
    // Botão de salvar no currículo
    const btnSalvarCurriculo = document.querySelector('#curriculo .btn-success');
    if (btnSalvarCurriculo) {
        btnSalvarCurriculo.addEventListener('click', salvarAlteracoes);
    }

    // Botão de salvar na conta
    const btnSalvarConta = document.querySelector('#conta .btn-success');
    if (btnSalvarConta) {
        btnSalvarConta.addEventListener('click', salvarContaAlteracoes);
    }

    // Botão de avançar
    const btnAvancar = document.querySelector('.btn-next');
    if (btnAvancar) {
        btnAvancar.addEventListener('click', async (e) => {
            e.preventDefault();
            await salvarCandidatoCompleto(true);
            // Aqui você pode adicionar lógica para ir para próxima página
            console.log('Avançando para próxima etapa...');
        });
    }
}

// ===== FUNÇÃO PARA VALIDAR FORMULÁRIO =====
function validarFormulario() {
    const dadosCandidato = coletarTodosDadosFormulario();
    const erros = [];

    // Validar campos obrigatórios
    if (!dadosCandidato.nome || dadosCandidato.nome.trim() === '') {
        erros.push('Nome é obrigatório');
    }

    if (!dadosCandidato.email || dadosCandidato.email.trim() === '') {
        erros.push('Email é obrigatório');
    } else if (!validarEmail(dadosCandidato.email)) {
        erros.push('Email inválido');
    }

    if (!dadosCandidato.cpf || dadosCandidato.cpf.length !== 11) {
        erros.push('CPF é obrigatório e deve ter 11 dígitos');
    } else if (!validarCPF(dadosCandidato.cpf)) {
        erros.push('CPF inválido');
    }

    if (!dadosCandidato.telefone || dadosCandidato.telefone.length < 10) {
        erros.push('Telefone é obrigatório');
    }

    return erros;
}

// ===== FUNÇÕES DE VALIDAÇÃO =====
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarCPF(cpf) {
    // Remover caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');

    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validar dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto < 2 ? 0 : resto;

    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto < 2 ? 0 : resto;

    return parseInt(cpf.charAt(10)) === digitoVerificador2;
}

// ===== FUNÇÃO PARA SINCRONIZAR COM BACKEND =====
async function sincronizarComBackend() {
    const backendDisponivel = await verificarBackend();

    if (!backendDisponivel) {
        console.log('Backend não disponível para sincronização');
        return false;
    }

    try {
        // Verificar se há dados no localStorage para sincronizar
        const candidatoLocal = localStorage.getItem(STORAGE_KEYS.CANDIDATO);
        const enderecoLocal = localStorage.getItem(STORAGE_KEYS.ENDERECO);

        if (candidatoLocal) {
            const dados = JSON.parse(candidatoLocal);

            // Verificar se precisa sincronizar (não tem ID ou não foi sincronizado)
            if (!dados.id || dados.sincronizado === false) {
                console.log('Sincronizando dados locais com backend...');
                await salvarCandidatoCompleto(false); // Não forçar, apenas sincronizar
                mostrarNotificacao('Dados sincronizados com o servidor!', 'success');
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Erro na sincronização:', error);
        return false;
    }
}

// ===== FUNÇÃO PARA VERIFICAR PERIODICAMENTE O BACKEND =====
function iniciarVerificacaoPeriodica() {
    // Verificar a cada 30 segundos se há dados para sincronizar
    setInterval(async () => {
        const candidatoLocal = localStorage.getItem(STORAGE_KEYS.CANDIDATO);

        if (candidatoLocal) {
            const dados = JSON.parse(candidatoLocal);

            // Se há dados não sincronizados, tentar sincronizar
            if (dados.sincronizado === false) {
                console.log('Tentando sincronização automática...');
                await sincronizarComBackend();
            }
        }
    }, 30000); // 30 segundos
}

// ===== FUNÇÃO DE INICIALIZAÇÃO =====
function inicializar() {
    console.log('Inicializando sistema...');

    // Marcar que é carregamento inicial
    isInitialLoad = true;

    // Carregar dados salvos
    carregarDadosLocalStorage();

    // Configurar máscaras
    configurarMascaras();

    // Configurar botões
    configurarBotoes();

    // Configurar auto-save após um pequeno delay
    setTimeout(() => {
        configurarAutoSave();
        autoSaveEnabled = true;
        isInitialLoad = false;
        console.log('Auto-save ativado');
    }, 1000);

    // Tentar sincronizar com backend
    setTimeout(() => {
        sincronizarComBackend();
    }, 2000);

    // Iniciar verificação periódica
    setTimeout(() => {
        iniciarVerificacaoPeriodica();
    }, 5000);

    // Mostrar status de conexão
    setTimeout(async () => {
        const backendDisponivel = await verificarBackend();
        if (!backendDisponivel) {
            mostrarNotificacao('Servidor offline. Dados serão salvos localmente.', 'warning');
        }
    }, 3000);

    console.log('Sistema inicializado com sucesso');
}

// ===== FUNÇÃO PARA LIMPAR TODOS OS DADOS =====
function limparTodosDados() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        // Limpar localStorage
        localStorage.removeItem(STORAGE_KEYS.CANDIDATO);
        localStorage.removeItem(STORAGE_KEYS.ENDERECO);

        // Limpar dados antigos para compatibilidade
        const chavesAntigas = ['nomeCandidato', 'emailCandidato', 'cpfCandidato', 'telCandidato', 'nome', 'email', 'cpf', 'telefone', 'senha', 'password'];
        chavesAntigas.forEach(chave => localStorage.removeItem(chave));

        // Recarregar página
        location.reload();
    }
}

// ===== EXECUTAR QUANDO O DOM ESTIVER CARREGADO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}

// ===== EXECUTAR QUANDO A PÁGINA FOR TOTALMENTE CARREGADA =====
window.addEventListener('load', () => {
    console.log('Página totalmente carregada');

    // Verificar se existem elementos que podem ter sido carregados dinamicamente
    setTimeout(() => {
        configurarMascaras();
        configurarBotoes();
    }, 500);
});

// ===== EXPORT DAS FUNÇÕES PRINCIPAIS (para uso em outros scripts) =====
window.candidatoManager = {
    salvar: salvarCandidatoCompleto,
    carregar: carregarDadosLocalStorage,
    limpar: limparTodosDados,
    validar: validarFormulario,
    sincronizar: sincronizarComBackend
};
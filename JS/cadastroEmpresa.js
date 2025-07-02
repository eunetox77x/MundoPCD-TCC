// Máscara para CNPJ
document.getElementById("cnpj").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 14); // CNPJ tem 14 dígitos

    if (value.length >= 12) {
        e.target.value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, "$1.$2.$3/$4-$5");
    } else if (value.length >= 8) {
        e.target.value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, "$1.$2.$3/$4");
    } else if (value.length >= 5) {
        e.target.value = value.replace(/^(\d{2})(\d{3})(\d{0,3})$/, "$1.$2.$3");
    } else if (value.length >= 3) {
        e.target.value = value.replace(/^(\d{2})(\d{0,3})$/, "$1.$2");
    } else {
        e.target.value = value;
    }
});

// Máscara para telefone
document.getElementById("telefone").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 11);
    if (value.length > 10) {
        e.target.value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
        e.target.value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
        e.target.value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else {
        e.target.value = value;
    }
});

// Cadastro
document.querySelector(".auth-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const nomeEmpresa = document.getElementById("nome-empresa").value.trim();
    const nomeResponsavel = document.getElementById("nome-responsavel").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.replace(/\D/g, '');
    const cnpj = document.getElementById("cnpj").value.replace(/\D/g, '');
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    if (!nomeEmpresa || !nomeResponsavel || !email || !telefone || !cnpj || !senha || !confirmarSenha) {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    const cadastroData = {
        nomeEmpresa,
        nomeResponsavel,
        email,
        telefone,
        cnpj,
        senha
    };

    console.log("Dados enviados:", cadastroData);

    fetch("http://localhost:8080/empresas/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cadastroData)
    })
    .then(async response => {
        if (!response.ok) {
            let errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.mensagem || "Erro desconhecido.");
            } catch (e) {
                throw new Error("Erro do servidor: " + errorText);
            }
        }
        return response.text();
    })
    .then(msg => {
        alert("Cadastro realizado com sucesso!");
        window.location.href = "login_empresa.html";
    })
    .catch(error => {
        console.error("Erro ao cadastrar empresa:", error);
        alert("Erro: " + error.message);
    });
});

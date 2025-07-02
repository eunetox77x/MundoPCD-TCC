// Máscara para CPF
document.getElementById("cpf").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 11);
    if (value.length >= 9) {
        e.target.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (value.length >= 6) {
        e.target.value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length >= 3) {
        e.target.value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
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

// cadastro
document.querySelector(".auth-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.replace(/\D/g, '');
    const cpf = document.getElementById("cpf").value.replace(/\D/g, '');
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (!nome || !email || !telefone || !cpf || !senha || !confirmarSenha) {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    const cadastroData = {
        nome,
        email,
        telefone,
        cpf,
        senha
    };

    fetch("http://localhost:8080/candidatos/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cadastroData)
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error(errorData.mensagem || "Erro desconhecido.");
        }
        return response.text();
    })
    .then(msg => {
        console.log("Candidato cadastrado:", msg);
        alert("Cadastro realizado com sucesso!");
        window.location.href = "pg_login.html";
    })
    .catch(error => {
        console.error("Erro ao cadastrar candidato:", error);
        alert("Erro: " + error.message); 
    });
});
//login
document.querySelector(".login-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    const loginData = {
        email,
        senha
    };

    fetch("http://localhost:8080/candidatos/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(msg => {
                throw new Error(msg);
            });
        }
        return response.json();
    })
    .then(candidato => {
        console.log("Login sucesso:", candidato);
        const idCandidato = candidato.idCandidato;

        // Salvar informações no localStorage
        localStorage.setItem('idCandidato', idCandidato);
        localStorage.setItem('nomeCandidato', candidato.nome);
        localStorage.setItem('cpfCandidato', candidato.cpf);
        localStorage.setItem('telCandidato', candidato.telefone);
        localStorage.setItem('emailCandidato', candidato.email);

        window.location.href = "dashboard_candidato.html"
    })
    .catch(error => {
        console.error("Erro ", error.message);
        alert(error.message);
    });
});
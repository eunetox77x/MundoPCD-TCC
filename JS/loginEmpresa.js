//login
document.querySelector(".login-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    const loginData = {
        email,
        senha
    };

    fetch("http://localhost:8080/empresas/login", {
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
    .then(empresa => {
        console.log("Login sucesso:", empresa);
        const idEmpresa = empresa.idEmpresa;

        // Salvar informações no localStorage
        localStorage.setItem('idEmpresa', idEmpresa);
        localStorage.setItem('nomeEmpresa', empresa.nomeEmpresa);
        localStorage.setItem('nomeResponsavel', empresa.nomeResponsavel)
        localStorage.setItem('cnpjEmpresa', empresa.cnpj);
        localStorage.setItem('telEmpresa', empresa.telefone);
        localStorage.setItem('emailEmpresa', empresa.email);

        window.location.href = "dashboard_empresa.html"
    })
    .catch(error => {
        console.error("Erro ", error.message);
        alert(error.message);
    });
});
const apiKey = "8175fA5f6098c5301022f475da32a2aa";
let token = null;
let startIndex = 1;
const initialLimit = 12;
const scrollLimit = 4;
const maxRecords = 105;

let isLoading = false;

async function authenticate() {
    try {
        const response = await fetch("https://ucsdiscosapi.azurewebsites.net/Discos/autenticar", {
            method: "POST",
            headers: { 
                accept: "*/*",
                ChaveApi: apiKey
            }
        });

        if (!response.ok) throw new Error("Erro na autenticação");

        const data = await response.text();
        token = data;
        console.log("Autenticação bem-sucedida! Token:", token);
    } catch (error) {
        console.error("Erro ao autenticar na API:", error);
        alert("Erro ao autenticar na API. Verifique sua conexão e tente novamente.");
    }
}

async function loadRecords(limit) {
    if (!token) {
        console.error("Token de autenticação ausente. Tentando autenticar novamente...");
        await authenticate();
        if (!token) {
            alert("Não foi possível autenticar. Por favor, tente novamente.");
            return;
        }
    }

    if (isLoading) return;
    isLoading = true;

    document.getElementById("loading").style.display = "block";
    try {
        if (startIndex >= 103) {
            limit = maxRecords - startIndex + 1;
        }

        const response = await fetch(`https://ucsdiscosapi.azurewebsites.net/Discos/records?numeroInicio=${startIndex}&quantidade=${limit}`, {
            method: "GET",
            headers: {
                TokenApiUCS: token
            }
        });

        if (!response.ok) throw new Error("Erro ao buscar registros");

        const records = await response.json();
        const container = document.getElementById("albumContainer");

        records.forEach(record => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6";

            col.innerHTML = `
                <img src="data:image/png;base64,${record.imagemEmBase64}" 
                     class="img-fluid clickable" 
                     alt="Capa do álbum" 
                     data-id="${record.id}">
            `;
            container.appendChild(col);
        });

        startIndex += limit;

        if (startIndex > maxRecords) {
            startIndex = 1;
            limit = 4;
        }
    } catch (error) {
        console.error("Erro ao carregar registros:", error);
        alert("Erro ao carregar registros. Por favor, tente novamente.");
    } finally {
        isLoading = false;
        document.getElementById("loading").style.display = "none";
    }
}


async function loadAlbumDetails(id) {
    if (!token) {
        console.error("Token de autenticação ausente. Tentando autenticar novamente...");
        await authenticate();
        if (!token) {
            alert("Não foi possível autenticar. Por favor, tente novamente.");
            return;
        }
    }

    try {
        const response = await fetch(`https://ucsdiscosapi.azurewebsites.net/Discos/record?numero=${id}`, {
            method: "GET",
            headers: {
                TokenApiUCS: token
            }
        });

        if (!response.ok) throw new Error("Erro ao buscar detalhes do álbum");

        const details = await response.json();

        document.getElementById("modalImage").src = `data:image/png;base64,${details.imagemEmBase64}`;
        document.getElementById("albumDetails").innerHTML = `
            <p><strong>ID:</strong> ${details.id}</p>
            <p><strong>Descrição Primária:</strong> ${details.descricaoPrimaria}</p>
            <p><strong>Descrição Secundária:</strong> ${details.descricaoSecundaria}</p>
        `;

        new bootstrap.Modal(document.getElementById("albumModal")).show();
    } catch (error) {
        console.error("Erro ao carregar detalhes do álbum:", error);
        alert("Erro ao carregar detalhes do álbum. Por favor, tente novamente.");
    }
}

document.getElementById("albumContainer").addEventListener("click", (e) => {
    if (e.target.classList.contains("clickable")) {
        const albumId = e.target.getAttribute("data-id");
        loadAlbumDetails(albumId);
    }
});

window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        loadRecords(scrollLimit);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Iniciando a página...");
    await authenticate();
    loadRecords(initialLimit);
});

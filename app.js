const ordensServico = JSON.parse(localStorage.getItem('ordensServico')) || [];

let mecanicoData = localStorage.getItem('mecanicoInfo');
if (!mecanicoData) {
    const nome = prompt("Digite o nome do mecânico:");
    const id = prompt("Digite o ID do mecânico:");
    mecanicoData = { nome, id };
    localStorage.setItem('mecanicoInfo', JSON.stringify(mecanicoData));
} else {
    mecanicoData = JSON.parse(mecanicoData);
}

const discordWebhookURL = 'https://discord.com/api/webhooks/1291850662480580669/aejdDMU8XQ-uJdNy_7Ol6IAqO5L0GyY6vCEKUCnsQS69lrjlmTz4R5zLVq40dqLCAUy8'; // Substitua com a URL do seu Webhook do Discord

// Função para formatar os valores para o padrão monetário brasileiro
function formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function adicionarOS(event) {
    event.preventDefault();

    const numero = document.getElementById('numero').value;
    const cliente = document.getElementById('cliente').value;
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const valorRecebido = valorTotal * 0.2;
    const status = document.getElementById('status').value;
    const dataAtual = new Date().toISOString().split('T')[0];

    const comissao = valorTotal * 0.2;
    const maoDeObra = valorTotal >= 50000 ? 0 : (valorTotal < 5000 ? 1000 : 0);

    const os = {
        numero,
        data: dataAtual,
        mecanico: mecanicoData.nome,
        mecanicoId: mecanicoData.id,
        cliente,
        valorTotal,
        valorRecebido,
        comissao,
        maoDeObra,
        status
    };

    ordensServico.push(os);
    localStorage.setItem('ordensServico', JSON.stringify(ordensServico));

    renderizarOS();
    document.getElementById('formOS').reset();

    // Enviar para o Discord
    enviarParaDiscord(os);
}

function renderizarOS() {
    const lista = document.getElementById('listaOS');
    lista.innerHTML = '';
    ordensServico.forEach((os, index) => {
        const item = document.createElement('div');
        item.className = 'os-card';
        item.innerHTML = `
            <p><strong>OS:</strong> ${os.numero}</p>
            <p><strong>Data:</strong> ${os.data}</p>
            <p><strong>Mecânico:</strong> ${os.mecanico} (#${os.mecanicoId})</p>
            <p><strong>Cliente:</strong> ${os.cliente}</p>
            <p><strong>Valor Total:</strong> ${formatarValor(os.valorTotal)}</p>
            <p><strong>Recebido:</strong> ${formatarValor(os.valorRecebido)}</p>
            <p><strong>Comissão:</strong> ${formatarValor(os.comissao)}</p>
            <p><strong>Mão de Obra:</strong> ${formatarValor(os.maoDeObra)}</p>
            <p><strong>Status:</strong> ${os.status}</p>
            <button onclick="alterarStatus(${index})">Alterar Status</button>
        `;
        lista.appendChild(item);
    });
}

function alterarStatus(index) {
    const os = ordensServico[index];
    const novoStatus = prompt(`Alterar status de pagamento para OS #${os.numero} (Atual: ${os.status})`, os.status);

    if (novoStatus && (novoStatus === 'Pago' || novoStatus === 'Não Pago')) {
        ordensServico[index].status = novoStatus;
        localStorage.setItem('ordensServico', JSON.stringify(ordensServico));
        renderizarOS();

        // Enviar a atualização para o Discord
        enviarParaDiscord(ordensServico[index]);
    } else {
        alert('Status inválido! Use "Pago" ou "Não Pago".');
    }
}

function enviarParaDiscord(os) {
    const embed = {
        "embeds": [{
            "title": `Ordem de Serviço - #${os.numero}`,
            "color": 3066993,
            "fields": [
                { "name": "Data", "value": os.data, "inline": true },
                { "name": "Mecânico", "value": `${os.mecanico} (#${os.mecanicoId})`, "inline": true },
                { "name": "Cliente", "value": os.cliente, "inline": true },
                { "name": "Valor Total", "value": formatarValor(os.valorTotal), "inline": true },
                { "name": "Valor Recebido", "value": formatarValor(os.valorRecebido), "inline": true },
                { "name": "Comissão", "value": formatarValor(os.comissao), "inline": true },
                { "name": "Mão de Obra", "value": formatarValor(os.maoDeObra), "inline": true },
                { "name": "Status", "value": os.status, "inline": true }
            ],
            "footer": {
                "text": "Sistema de Ordens de Serviço"
            }
        }]
    };

    fetch(discordWebhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embed)
    })
    .then(response => response.json())
    .then(data => console.log("Mensagem enviada para o Discord:", data))
    .catch(error => console.error("Erro ao enviar para o Discord:", error));
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formOS').addEventListener('submit', adicionarOS);
    renderizarOS();
});

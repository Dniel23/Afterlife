// app.js

let ordensServico = JSON.parse(localStorage.getItem('ordensServico')) || [];

let mecanicoData = localStorage.getItem('mecanicoInfo');
if (!mecanicoData) {
    const nome = prompt("Digite o nome do mecânico:");
    const id = prompt("Digite o ID do mecânico:");
    mecanicoData = { nome, id };
    localStorage.setItem('mecanicoInfo', JSON.stringify(mecanicoData));
} else {
    mecanicoData = JSON.parse(mecanicoData);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formOS').addEventListener('submit', adicionarOS);
    renderizarOS();
});

function adicionarOS(event) {
    event.preventDefault();

    const numero = document.getElementById('numero').value;
    const cliente = document.getElementById('cliente').value;
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const status = document.getElementById('status').value;
    const dataAtual = new Date().toISOString().split('T')[0];
    const imagemInput = document.getElementById('imagem');
    const imagemFile = imagemInput.files[0];

    const comissao = valorTotal * 0.2;
    const maoDeObra = valorTotal >= 50000 ? 0 : (valorTotal < 5000 ? 1000 : 0);
    const valorRecebido = comissao;

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

    enviarParaDiscordComImagem(os, imagemFile);
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
            <p><strong>Valor Total:</strong> R$ ${os.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Recebido:</strong> R$ ${os.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Comissão:</strong> R$ ${os.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Mão de Obra:</strong> R$ ${os.maoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Status:</strong> ${os.status}</p>
            ${os.status === "Não Pago" ? `<button class="confirmar-btn" onclick="marcarComoPago(${index})">Confirmar como Pago</button>` : ''}
        `;
        lista.appendChild(item);
    });
}

function marcarComoPago(index) {
    ordensServico[index].status = "Pago";
    localStorage.setItem('ordensServico', JSON.stringify(ordensServico));
    renderizarOS();
}

function importarOS() {
    const texto = document.getElementById('importarTexto').value;
    const regex = /#(\d+)\s*Cliente:\s*(.*)\s*Mecânico:\s*(.*)\s*\(#(\d+)\)\s*Valor:\s*R\$\s*([\d.,]+)\s*Status:\s*(.+)\s*Data:\s*(\d{4}-\d{2}-\d{2})/;

    const match = texto.match(regex);
    if (!match) {
        alert("Formato inválido! Certifique-se de que está seguindo o padrão.");
        return;
    }

    const os = {
        numero: match[1],
        cliente: match[2],
        mecanico: match[3],
        mecanicoId: match[4],
        valorTotal: parseFloat(match[5].replace('.', '').replace(',', '.')),
        status: match[6],
        data: match[7],
    };

    os.valorRecebido = os.valorTotal * 0.2;
    os.comissao = os.valorRecebido;
    os.maoDeObra = os.valorTotal >= 50000 ? 0 : (os.valorTotal < 5000 ? 1000 : 0);

    ordensServico.push(os);
    localStorage.setItem('ordensServico', JSON.stringify(ordensServico));
    renderizarOS();
    document.getElementById('importarTexto').value = '';
}


async function enviarParaDiscordComImagem(os, imagemFile) {
    const webhookUrl = 'https://discord.com/api/webhooks/1291850650891583560/HlannFLY4uKTvlyjlfhl5abOnT3q3G6mhJZBPE7rXjZgJxvZbt2fXf-pJp25oDW7oexD';

    const formData = new FormData();
    const conteudo = `
Nova OS - #${os.numero}
Cliente: ${os.cliente}
Mecânico: ${os.mecanico} (#${os.mecanicoId})
Valor: R$ ${os.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Status: ${os.status}
Data: ${os.data}
    `.trim();

    formData.append("content", conteudo);

    if (imagemFile) {
        formData.append("file", imagemFile, imagemFile.name);
    }

    await fetch(webhookUrl, {
        method: 'POST',
        body: formData
    });
}

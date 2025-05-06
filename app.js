let ordensServico = JSON.parse(localStorage.getItem('ordensServico')) || [];
let imagemBase64 = null; // Mantemos para a exibição local

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

    const areaColar = document.getElementById('areaColar');
    const imagemInput = document.getElementById('imagem');
    const removerImagemBtn = document.getElementById('removerImagem');
    const colarBtn = document.getElementById('colarBtn');
    const imagemColadaContainer = document.getElementById('imagemColadaContainer');
    const imagemColada = document.getElementById('imagemColada');

    areaColar.addEventListener('click', () => imagemInput.click());

    areaColar.addEventListener('dragover', (e) => {
        e.preventDefault();
        areaColar.classList.add('arrastando');
    });

    areaColar.addEventListener('dragleave', () => {
        areaColar.classList.remove('arrastando');
    });

    areaColar.addEventListener('drop', (e) => {
        e.preventDefault();
        areaColar.classList.remove('arrastando');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            carregarImagemLocal(file);
        } else {
            alert('Por favor, cole ou arraste apenas arquivos de imagem.');
        }
    });

    colarBtn.addEventListener('click', async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        carregarImagemLocal(blob);
                        return; // Encontrou uma imagem, pode sair
                    }
                }
            }
            alert('Nenhuma imagem encontrada na área de transferência.');
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                alert('Permissão para acessar a área de transferência negada. Por favor, use o clique ou arraste para adicionar a imagem.');
            } else {
                console.error('Erro ao colar imagem:', err);
                alert('Ocorreu um erro ao tentar colar a imagem.');
            }
        }
    });

    removerImagemBtn.addEventListener('click', () => {
        imagemBase64 = null;
        imagemColada.src = '#';
        imagemColadaContainer.style.display = 'none';
        document.getElementById('colarImagemContainer').style.display = 'flex';
    });

    imagemInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            carregarImagemLocal(this.files[0]);
        }
    });
});

function carregarImagemLocal(fileOrBlob) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagemBase64 = e.target.result;
        document.getElementById('imagemColada').src = imagemBase64;
        document.getElementById('imagemColadaContainer').style.display = 'flex';
        document.getElementById('colarImagemContainer').style.display = 'none';
    }
    reader.readAsDataURL(fileOrBlob);
}

function adicionarOS(event) {
    event.preventDefault();

    const numero = document.getElementById('numero').value;
    const cliente = document.getElementById('cliente').value;
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const status = document.getElementById('status').value;
    const dataAtual = new Date().toISOString().split('T')[0];
    const imagemInput = document.getElementById('imagem');
    const imagemFile = imagemInput.files[0];
    let arquivoParaEnviar = imagemFile;

    if (!arquivoParaEnviar && imagemBase64) {
        // Se não há arquivo selecionado, mas temos uma imagem colada (em base64), convertemos para Blob
        arquivoParaEnviar = dataURLtoBlob(imagemBase64);
    }

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
        status,
        imagemBase64: imagemBase64 // Mantemos para exibição na lista
    };

    ordensServico.push(os);
    localStorage.setItem('ordensServico', JSON.stringify(ordensServico));

    renderizarOS();
    document.getElementById('formOS').reset();
    document.getElementById('imagemColadaContainer').style.display = 'none';
    document.getElementById('colarImagemContainer').style.display = 'flex';
    imagemBase64 = null; // Reseta para a próxima OS

    enviarParaDiscordComImagem(os, arquivoParaEnviar);
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
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
            ${os.imagemBase64 ? `<img src="${os.imagemBase64}" alt="Imagem da OS" style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;">` : ''}
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
Comissão: R$ ${os.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Mão de Obra: R$ ${os.maoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Status: ${os.status}
Data: ${os.data}
    `.trim();

    formData.append("content", conteudo);

    if (imagemFile) {
        formData.append("file", imagemFile, imagemFile.name || 'colada.png'); // Tenta usar o nome original ou um genérico
    }

    await fetch(webhookUrl, {
        method: 'POST',
        body: formData
    });
}
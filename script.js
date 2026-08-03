const track = document.getElementById('carouselTrack');
const thumbnailsContainer = document.getElementById('thumbnailsContainer');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const imageAddress = document.getElementById('imageAddress');
const copyAddressBtn = document.getElementById('copyAddressBtn');

let imagens = [];
let currentIndex = 0;
let refreshIntervalId = null;

function normalizarImagem(file) {
    if (typeof file === 'string') {
        return {
            url: new URL(`./imagens/${encodeURIComponent(file)}`, window.location.href).toString(),
            alt: file
        };
    }

    if (file && typeof file === 'object') {
        const fileName = file.filename || file.name || file.alt || '';
        const imageUrl = file.url || `./imagens/${encodeURIComponent(fileName)}`;

        return {
            url: new URL(imageUrl, window.location.href).toString(),
            alt: fileName || 'Imagem'
        };
    }

    return {
        url: '',
        alt: 'Imagem'
    };
}

async function carregarImagensPadrao() {
    const isLocalServer = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    try {
        if (isLocalServer) {
            const apiResponse = await fetch('/api/images', { cache: 'no-store' });

            if (!apiResponse.ok) {
                throw new Error(`Falha ao consultar a API de imagens: ${apiResponse.status}`);
            }

            const apiData = await apiResponse.json();
            const files = Array.isArray(apiData.images)
                ? apiData.images
                : [];

            imagens = files.map(normalizarImagem);

            currentIndex = 0;
            renderizarGaleria();
            return;
        }

        const staticResponse = await fetch('./images.json', { cache: 'no-store' });
        if (!staticResponse.ok) {
            throw new Error(`Falha ao carregar images.json: ${staticResponse.status}`);
        }

        const staticImages = await staticResponse.json();
        if (!Array.isArray(staticImages) || staticImages.length === 0) {
            throw new Error('A lista estática está vazia.');
        }

        imagens = staticImages.map(normalizarImagem);

        currentIndex = 0;
        renderizarGaleria();
    } catch (error) {
        imagens = [];
        renderizarGaleria();

        if (imageAddress) {
            imageAddress.value = 'Nenhuma imagem encontrada na pasta.';
        }
    }
}

carregarImagensPadrao();

function iniciarAtualizacaoAutomatica() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }

    refreshIntervalId = setInterval(async () => {
        await carregarImagensPadrao();
    }, 3000);
}

iniciarAtualizacaoAutomatica();

function renderizarGaleria() {
    track.innerHTML = '';
    thumbnailsContainer.innerHTML = '';

    imagens.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.classList.add('carousel-slide');
        if (index === 0) slide.classList.add('current-slide');

        const link = document.createElement('a');
        link.href = img.url;
        link.target = "_blank";

        const image = document.createElement('img');
        image.src = img.url;
        image.alt = img.alt;
        
        link.appendChild(image);
        slide.appendChild(link);
        track.appendChild(slide);

        const thumb = document.createElement('img');
        thumb.src = img.url;
        thumb.alt = img.alt;
        thumb.classList.add('thumbnail');
        if (index === 0) thumb.classList.add('active');

        thumb.addEventListener('click', () => {
            moveToSlide(index);
        });

        thumbnailsContainer.appendChild(thumb);
    });

    moveToSlide(0);
}

function moveToSlide(targetIndex) {
    if (imagens.length === 0) return;

    if (targetIndex < 0) {
        targetIndex = imagens.length - 1;
    } else if (targetIndex >= imagens.length) {
        targetIndex = 0;
    }

    currentIndex = targetIndex;
    const amountToMove = -currentIndex * 100;
    track.style.transform = `translateX(${amountToMove}%)`;

    const thumbs = document.querySelectorAll('.thumbnail');
    thumbs.forEach((thumb, idx) => {
        if (idx === currentIndex) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        } else {
            thumb.classList.remove('active');
        }
    });

    if (imageAddress) {
        imageAddress.value = imagens[currentIndex].url;
    }
}

copyAddressBtn.addEventListener('click', async () => {
    if (!imageAddress.value) return;

    try {
        await navigator.clipboard.writeText(imageAddress.value);
        imageAddress.value = `${imageAddress.value} (copiado)`;
    } catch (error) {
        imageAddress.value = 'Não foi possível copiar automaticamente. Selecione o endereço manualmente.';
    }
});

nextBtn.addEventListener('click', () => {
    moveToSlide(currentIndex + 1);
});

prevBtn.addEventListener('click', () => {
    moveToSlide(currentIndex - 1);
});

let touchStartX = 0;
let touchEndX = 0;

track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleGesture();
});

function handleGesture() {
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) {
        moveToSlide(currentIndex + 1); 
    }
    if (touchEndX > touchStartX + threshold) {
        moveToSlide(currentIndex - 1); 
    }
}
const track = document.getElementById('carouselTrack');
const thumbnailsContainer = document.getElementById('thumbnailsContainer');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const imageAddress = document.getElementById('imageAddress');
const copyAddressBtn = document.getElementById('copyAddressBtn');

let imagens = [];
let currentIndex = 0;
let refreshIntervalId = null;

async function carregarImagens() {
    try {
        const response = await fetch('/api/images', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Falha ao carregar imagens: ${response.status}`);
        }

        const payload = await response.json();
        const rawImages = Array.isArray(payload)
            ? payload
            : (payload && Array.isArray(payload.images) ? payload.images : []);

        imagens = rawImages.map((item) => {
            if (typeof item === 'string') {
                return {
                    name: item,
                    url: `/imagens/${encodeURIComponent(item)}`
                };
            }

            const name = item?.name || item?.filename || item?.alt || '';
            const url = item?.url || `/imagens/${encodeURIComponent(name)}`;
            return { name, url };
        });

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

function renderizarGaleria() {
    track.innerHTML = '';
    thumbnailsContainer.innerHTML = '';

    if (imagens.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'carousel-slide';
        placeholder.innerHTML = '<p>Nenhuma imagem encontrada na pasta.</p>';
        track.appendChild(placeholder);
        return;
    }

    imagens.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const link = document.createElement('a');
        link.href = img.url;
        link.target = '_blank';

        const image = document.createElement('img');
        image.src = img.url;
        image.alt = img.name;

        link.appendChild(image);
        slide.appendChild(link);
        track.appendChild(slide);

        const thumb = document.createElement('img');
        thumb.src = img.url;
        thumb.alt = img.name;
        thumb.className = 'thumbnail';
        if (index === 0) thumb.classList.add('active');

        thumb.addEventListener('click', () => moveToSlide(index));
        thumbnailsContainer.appendChild(thumb);
    });

    moveToSlide(0);
}

function moveToSlide(targetIndex) {
    if (imagens.length === 0) return;

    if (targetIndex < 0) targetIndex = imagens.length - 1;
    if (targetIndex >= imagens.length) targetIndex = 0;

    currentIndex = targetIndex;
    const amountToMove = -currentIndex * 100;
    track.style.transform = `translateX(${amountToMove}%)`;

    document.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === currentIndex);
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

nextBtn.addEventListener('click', () => moveToSlide(currentIndex + 1));
prevBtn.addEventListener('click', () => moveToSlide(currentIndex - 1));

let touchStartX = 0;
let touchEndX = 0;

track.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
});

track.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].screenX;
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) moveToSlide(currentIndex + 1);
    if (touchEndX > touchStartX + threshold) moveToSlide(currentIndex - 1);
});

carregarImagens();
if (refreshIntervalId) clearInterval(refreshIntervalId);
refreshIntervalId = setInterval(carregarImagens, 3000);

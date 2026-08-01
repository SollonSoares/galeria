const fileInput = document.getElementById('fileInput');
const uploadInput = document.getElementById('uploadInput');
const sendUploadBtn = document.getElementById('sendUploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const track = document.getElementById('carouselTrack');
const thumbnailsContainer = document.getElementById('thumbnailsContainer');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const imageAddress = document.getElementById('imageAddress');
const copyAddressBtn = document.getElementById('copyAddressBtn');

let imagens = [];
let currentIndex = 0;

async function carregarImagensPadrao() {
    try {
        const response = await fetch('/api/images');
        const result = await response.json();

        if (!Array.isArray(result.images) || result.images.length === 0) {
            return;
        }

        imagens = result.images.map(fileName => ({
            url: `${window.location.origin}/imagens/${encodeURIComponent(fileName)}`,
            alt: fileName
        }));

        currentIndex = 0;
        renderizarGaleria();
    } catch (error) {
        uploadStatus.textContent = 'Não foi possível carregar as imagens da pasta do projeto.';
    }
}

carregarImagensPadrao();

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    imagens = imageFiles.map(file => {
        const objectUrl = URL.createObjectURL(file);
        return {
            url: objectUrl,
            alt: file.name
        };
    });

    currentIndex = 0;
    renderizarGaleria();
});

sendUploadBtn.addEventListener('click', async () => {
    const file = uploadInput.files[0];
    if (!file) {
        uploadStatus.textContent = 'Selecione uma imagem primeiro.';
        return;
    }

    const formData = new FormData();
    formData.append('imagem', file);

    uploadStatus.textContent = 'Enviando imagem...';

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao enviar a imagem.');
        }

        const imageUrl = `${window.location.origin}/uploads/${encodeURIComponent(result.filename)}`;
        imagens = [{ url: imageUrl, alt: result.filename }];
        currentIndex = 0;
        renderizarGaleria();
        uploadStatus.textContent = `Imagem enviada com sucesso: ${result.filename}`;
    } catch (error) {
        uploadStatus.textContent = error.message;
    }
});

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
        uploadStatus.textContent = 'Endereço copiado para a área de transferência.';
    } catch (error) {
        uploadStatus.textContent = 'Não foi possível copiar automaticamente. Selecione o endereço manualmente.';
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
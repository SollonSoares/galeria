const imagens = [
    { url: "imagens/sua-imagem.jpg", alt: "Descrição da imagem" }
];

const track = document.getElementById('carouselTrack');
const thumbnailsContainer = document.getElementById('thumbnailsContainer');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

let currentIndex = 0;

function carregarGaleria() {
    imagens.forEach((img, index) => {
        // Slide do Carrossel
        const slide = document.createElement('div');
        slide.classList.add('carousel-slide');
        if (index === 0) slide.classList.add('current-slide');

        const image = document.createElement('img');
        image.src = img.url;
        image.alt = img.alt;
        
        slide.appendChild(image);
        track.appendChild(slide);

        // Miniatura (Thumb)
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
}

function moveToSlide(targetIndex) {
    if (targetIndex < 0) {
        targetIndex = imagens.length - 1;
    } else if (targetIndex >= imagens.length) {
        targetIndex = 0;
    }

    currentIndex = targetIndex;
    const amountToMove = -currentIndex * 100;
    track.style.transform = `translateX(${amountToMove}%)`;

    // Atualizar classe ativa das thumbs e centralizar no scroll horizontal mobile
    const thumbs = document.querySelectorAll('.thumbnail');
    thumbs.forEach((thumb, idx) => {
        if (idx === currentIndex) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        } else {
            thumb.classList.remove('active');
        }
    });
}

nextBtn.addEventListener('click', () => {
    moveToSlide(currentIndex + 1);
});

prevBtn.addEventListener('click', () => {
    moveToSlide(currentIndex - 1);
});

// Suporte a gestos de toque (Touch Events) para Mobile
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

// Inicialização
carregarGaleria();
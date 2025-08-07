// LOGICA CARRUSEL
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');
let currentIndex = 0;

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
        dots[i].classList.toggle('active', i === index);
    });
    currentIndex = index;
}

prevBtn.addEventListener('click', () => {
    let index = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(index);
});

nextBtn.addEventListener('click', () => {
    let index = (currentIndex + 1) % slides.length;
    showSlide(index);
});

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => showSlide(i));
});

// Auto-play opcional
setInterval(() => {
    let index = (currentIndex + 1) % slides.length;
    showSlide(index);
}, 7500);
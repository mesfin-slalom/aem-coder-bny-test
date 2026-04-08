import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { decorateIcons } from '../../scripts/aem.js';

const AUTOPLAY_INTERVAL = 5000;

function updateSliderBar(block) {
  const slides = block.querySelectorAll('.carousel-slide');
  const slider = block.querySelector('.carousel-slider');
  const sliderBar = block.querySelector('.carousel-slider-bar');
  if (!sliderBar || !slider || slides.length === 0) return;

  const currentIndex = parseInt(block.dataset.activeSlide, 10) || 0;
  const totalSlides = slides.length;
  const sliderWidth = slider.offsetWidth;
  const barWidth = sliderBar.offsetWidth;
  const maxLeft = sliderWidth - barWidth;
  const left = totalSlides <= 1 ? 0 : (currentIndex / (totalSlides - 1)) * maxLeft;

  sliderBar.style.left = `${left}px`;
}

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');
  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  updateSliderBar(block);
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  block.dataset.activeSlide = realSlideIndex;

  slides.forEach((s, idx) => {
    s.setAttribute('aria-hidden', idx !== realSlideIndex);
    s.querySelectorAll('a').forEach((link) => {
      if (idx !== realSlideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });

  updateSliderBar(block);
}

function getActiveSlideIndex(block) {
  return parseInt(block.dataset.activeSlide, 10) || 0;
}

function startAutoplay(block) {
  if (block.carouselAutoplayInterval) return;
  const intervalId = setInterval(() => {
    const slides = block.querySelectorAll('.carousel-slide');
    const currentIndex = getActiveSlideIndex(block);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    showSlide(block, nextIndex);
  }, AUTOPLAY_INTERVAL);
  block.carouselAutoplayInterval = intervalId;
}

function pauseAutoplay(block) {
  if (block.carouselAutoplayInterval) {
    clearInterval(block.carouselAutoplayInterval);
    block.carouselAutoplayInterval = null;
  }
}

function bindEvents(block) {
  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, getActiveSlideIndex(block) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, getActiveSlideIndex(block) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  // Add arrow-right icon button at bottom of content
  const contentDiv = slide.querySelector('.carousel-slide-content');
  if (contentDiv) {
    const arrowWrapper = document.createElement('div');
    arrowWrapper.classList.add('carousel-slide-arrow');
    const arrowBtn = document.createElement('button');
    arrowBtn.setAttribute('type', 'button');
    arrowBtn.setAttribute('aria-label', 'View details');
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('icon', 'icon-arrow-right');
    arrowBtn.append(iconSpan);
    arrowWrapper.append(arrowBtn);
    contentDiv.append(arrowWrapper);
    decorateIcons(arrowWrapper);
  }

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  block.dataset.activeSlide = 0;
  const hasAutoplay = block.classList.contains('carousel-autoplay');
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let controlsWrapper;
  if (!isSingleSlide) {
    // Build slider bar
    const slider = document.createElement('div');
    slider.classList.add('carousel-slider');
    const sliderBar = document.createElement('div');
    sliderBar.classList.add('carousel-slider-bar');
    slider.append(sliderBar);

    // Build navigation buttons
    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    let navButtonsHTML = `<button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"><span class="icon icon-arrow-left"></span></button>`;
    if (hasAutoplay) {
      navButtonsHTML += '<button type="button" class="carousel-player player-pause" aria-label="Pause"><span class="icon icon-player-pause"></span></button>';
    }
    navButtonsHTML += `<button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"><span class="icon icon-arrow-right"></span></button>`;
    slideNavButtons.innerHTML = navButtonsHTML;
    decorateIcons(slideNavButtons);

    controlsWrapper = document.createElement('div');
    controlsWrapper.classList.add('carousel-controls-wrapper');
    controlsWrapper.append(slider);
    controlsWrapper.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);

  // Add gradient overlays
  if (!isSingleSlide) {
    const gradientLeft = document.createElement('div');
    gradientLeft.classList.add('carousel-gradient-left');
    container.append(gradientLeft);

    const gradientRight = document.createElement('div');
    gradientRight.classList.add('carousel-gradient-right');
    container.append(gradientRight);
  }

  block.prepend(container);

  if (controlsWrapper) {
    block.append(controlsWrapper);
  }

  if (!isSingleSlide) {
    bindEvents(block);
    updateSliderBar(block);

    if (hasAutoplay) {
      setTimeout(() => {
        if (!block.dataset.activeSlide) {
          showSlide(block, 0, 'auto');
        }
        startAutoplay(block);
        block.carouselPausedByButton = false;
        block.addEventListener('mouseenter', () => {
          pauseAutoplay(block);
        });
        block.addEventListener('mouseleave', () => {
          if (!block.carouselPausedByButton) {
            startAutoplay(block);
          }
        });

        const playerBtn = block.querySelector('.carousel-player');
        if (playerBtn) {
          playerBtn.addEventListener('click', () => {
            const iconSpan = playerBtn.querySelector('.icon');
            iconSpan.textContent = '';
            if (playerBtn.classList.contains('player-pause')) {
              pauseAutoplay(block);
              block.carouselPausedByButton = true;
              playerBtn.classList.remove('player-pause');
              playerBtn.classList.add('player-play');
              playerBtn.setAttribute('aria-label', 'Play');
              iconSpan.className = 'icon icon-player-play';
            } else {
              block.carouselPausedByButton = false;
              startAutoplay(block);
              playerBtn.classList.remove('player-play');
              playerBtn.classList.add('player-pause');
              playerBtn.setAttribute('aria-label', 'Pause');
              iconSpan.className = 'icon icon-player-pause';
            }
            decorateIcons(playerBtn);
          });
        }
      }, 0);
    }
  }
}

import { fetchPlaceholders } from '../../scripts/placeholders.js';

const AUTOPLAY_INTERVAL = 5000;

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

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function startAutoplay(block) {
  if (block.carouselAutoplayInterval) return; // Prevent multiple intervals
  const intervalId = setInterval(() => {
    const slides = block.querySelectorAll('.carousel-slide');
    const currentIndex = parseInt(block.dataset.activeSlide, 10) || 0;
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
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
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
  // Check for 'carousel-autoplay' class
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

  let slideIndicators;
  let controlsWrapper;
  if (!isSingleSlide) {
    const slideNavBar = document.createElement('div');
    slideNavBar.classList.add('carousel-nav-bar');

    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    // Build navigation buttons HTML
    let navButtonsHTML = `<button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>`;
    if (hasAutoplay) {
      navButtonsHTML += '<button type="button" class="carousel-player player-pause" aria-label="Pause"></button>';
    }
    navButtonsHTML += `<button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>`;
    slideNavButtons.innerHTML = navButtonsHTML;

    controlsWrapper = document.createElement('div');
    controlsWrapper.classList.add('carousel-controls-wrapper');
    controlsWrapper.append(slideNavButtons);
    controlsWrapper.append(slideNavBar);
    // Will append after container below
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    const hasButton = slide.querySelector('.button');

    if (hasButton) {
      hasButton.classList.add('primary');
    }

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  // Append controls wrapper after container
  if (controlsWrapper) {
    block.append(controlsWrapper);
  }

  if (!isSingleSlide) {
    bindEvents(block);
    if (hasAutoplay) {
      // Start autoplay after initial render
      setTimeout(() => {
        // Ensure the first slide is shown and activeSlide is set
        if (!block.dataset.activeSlide) {
          showSlide(block, 0, 'auto');
        }
        startAutoplay(block);
        // Pause on hover, resume on mouse leave
        block.carouselPausedByButton = false;
        block.addEventListener('mouseenter', () => {
          pauseAutoplay(block);
        });
        block.addEventListener('mouseleave', () => {
          if (!block.carouselPausedByButton) {
            startAutoplay(block);
          }
        });

        // Add click event for pause/play button
        const playerBtn = block.querySelector('.carousel-player');
        if (playerBtn) {
          playerBtn.addEventListener('click', () => {
            if (playerBtn.classList.contains('player-pause')) {
              pauseAutoplay(block);
              block.carouselPausedByButton = true;
              playerBtn.classList.remove('player-pause');
              playerBtn.classList.add('player-play');
              playerBtn.setAttribute('aria-label', 'Play');
            } else {
              block.carouselPausedByButton = false;
              startAutoplay(block);
              playerBtn.classList.remove('player-play');
              playerBtn.classList.add('player-pause');
              playerBtn.setAttribute('aria-label', 'Pause');
            }
          });
        }
      }, 0);
    }
  }
}

import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { decorateIcons } from '../../scripts/aem.js';

const AUTOPLAY_INTERVAL = 5000;

function updateSliderBar(block) {
  const slidesContainer = block.querySelector('.carousel-slides');
  const slider = block.querySelector('.carousel-slider');
  const sliderBar = block.querySelector('.carousel-slider-bar');
  if (!sliderBar || !slider || !slidesContainer) return;

  const maxScroll = slidesContainer.scrollWidth - slidesContainer.clientWidth;
  const sliderWidth = slider.offsetWidth;
  const barWidth = sliderBar.offsetWidth;
  const maxLeft = sliderWidth - barWidth;

  if (maxScroll <= 0) {
    // All slides visible — animate bar based on active slide index
    const slides = block.querySelectorAll('.carousel-slide');
    const currentIndex = parseInt(block.dataset.activeSlide, 10) || 0;
    const totalSlides = slides.length;
    const left = totalSlides <= 1 ? 0 : (currentIndex / (totalSlides - 1)) * maxLeft;
    sliderBar.style.transition = 'left 0.3s ease';
    sliderBar.style.left = `${left}px`;
    return;
  }

  // Scroll-driven — no transition, update directly each frame
  sliderBar.style.transition = 'none';
  const scrollRatio = slidesContainer.scrollLeft / maxScroll;
  const left = scrollRatio * maxLeft;
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
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  const slidesContainer = block.querySelector('.carousel-slides');
  const maxScroll = slidesContainer.scrollWidth - slidesContainer.clientWidth;
  const currentScroll = Math.round(slidesContainer.scrollLeft);

  let realSlideIndex = slideIndex;

  // Wrap around
  if (slideIndex >= slides.length) realSlideIndex = 0;
  if (slideIndex < 0) realSlideIndex = slides.length - 1;

  // If at scroll end and advancing forward, wrap to start
  if (currentScroll >= maxScroll - 2 && slideIndex >= slides.length) {
    realSlideIndex = 0;
  }

  // If at scroll start and going backward, wrap to end
  if (currentScroll <= 2 && slideIndex < 0) {
    realSlideIndex = slides.length - 1;
  }

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

  const targetScroll = activeSlide.offsetLeft;

  // If all slides are visible (no scrollable overflow) or scroll won't change,
  // manually update slider bar since no scroll event will fire
  if (maxScroll <= 0 || Math.abs(targetScroll - currentScroll) < 2) {
    updateSliderBar(block);
  } else {
    slidesContainer.scrollTo({
      top: 0,
      left: targetScroll,
      behavior: 'smooth',
    });
  }
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
  let isNavigating = false;

  block.querySelector('.slide-prev').addEventListener('click', () => {
    isNavigating = true;
    showSlide(block, getActiveSlideIndex(block) - 1);
    setTimeout(() => { isNavigating = false; }, 600);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    isNavigating = true;
    showSlide(block, getActiveSlideIndex(block) + 1);
    setTimeout(() => { isNavigating = false; }, 600);
  });

  // Use scroll events on the slides container to track position
  const slidesContainer = block.querySelector('.carousel-slides');
  let scrollTimeout;
  let isDragging = false;
  slidesContainer.addEventListener('scroll', () => {
    // Always update slider bar position during scroll (unless user is dragging the bar)
    if (!isDragging) updateSliderBar(block);

    // Debounce active slide detection (skip during button navigation or dragging)
    if (isNavigating || isDragging) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const slides = block.querySelectorAll('.carousel-slide');
      const { scrollLeft } = slidesContainer;
      let [closestSlide] = slides;
      let closestDistance = Infinity;
      slides.forEach((slide) => {
        const distance = Math.abs(slide.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSlide = slide;
        }
      });
      updateActiveSlide(closestSlide);
    }, 100);
  });

  // Draggable slider bar (mouse + touch)
  const slider = block.querySelector('.carousel-slider');
  const sliderBar = block.querySelector('.carousel-slider-bar');
  if (!slider || !sliderBar) return;

  let dragStartX = 0;
  let dragSlideIndex = 0;
  let dragSnapped = false;
  const DRAG_THRESHOLD = 10;

  const getPointerX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

  const onDragMove = (e) => {
    if (!isDragging || dragSnapped) return;
    e.preventDefault();
    const deltaX = getPointerX(e) - dragStartX;

    if (Math.abs(deltaX) >= DRAG_THRESHOLD) {
      dragSnapped = true;
      // Stop suppressing slider bar updates so the snap animates the bar
      isDragging = false;
      const nextIndex = deltaX > 0 ? dragSlideIndex + 1 : dragSlideIndex - 1;
      showSlide(block, nextIndex);
    }
  };

  const onDragEnd = () => {
    isDragging = false;
    dragSnapped = false;
    sliderBar.style.cursor = '';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
  };

  const onDragStart = (e) => {
    isDragging = true;
    dragSnapped = false;
    dragStartX = getPointerX(e);
    dragSlideIndex = getActiveSlideIndex(block);
    sliderBar.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  };

  sliderBar.addEventListener('mousedown', onDragStart);
  sliderBar.addEventListener('touchstart', onDragStart, { passive: true });

  // Click on slider track to jump forward/backward
  slider.addEventListener('click', (e) => {
    if (e.target === sliderBar || isDragging) return;
    const sliderRect = slider.getBoundingClientRect();
    const clickX = e.clientX - sliderRect.left;
    const barCenter = parseFloat(sliderBar.style.left || 0) + (sliderBar.offsetWidth / 2);
    const currentIndex = getActiveSlideIndex(block);

    if (clickX > barCenter) {
      showSlide(block, currentIndex + 1);
    } else {
      showSlide(block, currentIndex - 1);
    }
  });
}

function createSlide(row, slideIndex, carouselId, block) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  // Add arrow-right icon button at bottom of content (teaser-overlay only)
  const contentDiv = slide.querySelector('.carousel-slide-content');
  if (contentDiv && block.classList.contains('teaser-overlay')) {
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
    const slide = createSlide(row, idx, carouselId, block);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);

  // Add gradient overlay (right edge only)
  if (!isSingleSlide) {
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

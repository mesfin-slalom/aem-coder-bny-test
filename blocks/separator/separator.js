/**
 * Decorates the separator block.
 * @param {Element} block The separator block element
 */
export default function decorate(block) {
  const hr = document.createElement('hr');

  if (block.classList.contains('hide-color')) {
    hr.setAttribute('aria-hidden', 'true');
  }

  block.textContent = '';
  block.append(hr);
}

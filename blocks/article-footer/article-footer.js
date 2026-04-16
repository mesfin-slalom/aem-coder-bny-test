import { decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Loads and decorates the article footer block.
 * @param {Element} block The article-footer block element
 */
export default async function decorate(block) {
  const fragment = await loadFragment('/corporate/global/article-footer')
    || await loadFragment('/content/corporate/global/article-footer');

  block.textContent = '';
  if (fragment) {
    while (fragment.firstElementChild) block.append(fragment.firstElementChild);
  }

  // Re-apply button styling to link paragraphs (stripped by fragment decoration)
  const dcw = block.querySelector('.default-content-wrapper');
  if (dcw) {
    dcw.querySelectorAll('p:has(> a)').forEach((p) => {
      const link = p.querySelector('a');
      if (!link) return;
      p.classList.add('button-container');
      link.classList.add('button', 'tertiary');

      // Add arrow-right icon if missing
      if (!link.querySelector('.icon')) {
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('icon', 'icon-arrow-right');
        link.append(iconSpan);
      }
    });
    decorateIcons(dcw);
  }
}

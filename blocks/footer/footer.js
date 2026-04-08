import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Decorates the footer menu section by grouping headings and lists into columns.
 * @param {Element} section The footer menu section element
 */
function decorateFooterMenu(section) {
  const wrapper = section.querySelector(':scope > div');
  if (!wrapper) return;

  const nav = document.createElement('nav');
  nav.className = 'footer-nav';
  nav.setAttribute('aria-label', 'Footer');

  const children = [...wrapper.children];
  let currentColumn = null;

  children.forEach((child) => {
    const strong = child.tagName === 'P' && child.querySelector('strong');
    const isButton = child.classList.contains('button-wrapper');

    if (strong && !isButton) {
      currentColumn = document.createElement('div');
      currentColumn.className = 'footer-nav-column';
      const heading = document.createElement('p');
      heading.className = 'footer-nav-heading';
      heading.textContent = strong.textContent;
      currentColumn.append(heading);
      nav.append(currentColumn);
    } else if (child.tagName === 'UL' && currentColumn) {
      currentColumn.append(child);
    } else {
      currentColumn = null;
      nav.append(child);
    }
  });

  wrapper.replaceChildren(nav);
}

/**
 * Decorates the footer social & legal section.
 * Expects: a paragraph with social icon links, followed by a paragraph of legal text.
 * @param {Element} section The footer social & legal section element
 */
function decorateFooterSocial(section) {
  const wrapper = section.querySelector(':scope > div');
  if (!wrapper) return;

  // Find the paragraph containing social icon links
  const socialIcons = wrapper.querySelector('p:has(.icon)');
  if (socialIcons) {
    socialIcons.classList.add('footer-social-icons');
    // Wrap each social link in a container for hover/active/focus styling
    [...socialIcons.querySelectorAll('a')].forEach((link) => {
      const container = document.createElement('span');
      container.className = 'footer-social-icon';
      link.before(container);
      container.append(link);
    });
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // decorate sections
  const sections = footer.querySelectorAll('.section');
  if (sections.length > 0) {
    sections[0].classList.add('footer-menu');
    decorateFooterMenu(sections[0]);
  }
  if (sections.length > 1) {
    sections[1].classList.add('footer-social-legal');
    decorateFooterSocial(sections[1]);
  }

  block.append(footer);
}

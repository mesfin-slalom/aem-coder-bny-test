import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 1025px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches && e.relatedTarget) {
      // Only close mobile menu if focus explicitly moved outside nav
      // (not when clicking non-focusable elements like accordion items)
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function getTopLevelItems(sections) {
  if (!sections) return [];
  const wrapper = sections.querySelector('.default-content-wrapper');
  const container = wrapper || sections.querySelector(':scope > div > div') || sections;
  const ul = container.querySelector(':scope > ul');
  return ul ? [...ul.children] : [];
}

function collapseAllNavSections(sections) {
  if (!sections) return;
  getTopLevelItems(sections).forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  getTopLevelItems(sections).forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Builds mega menu DOM from authored nested list structure.
 * Expects: li > ul containing:
 *   - li with <strong> heading + nested ul of links = link column group
 *   - li.mega-menu-teaser with picture + p + p>a = teaser card
 */
function buildMegaMenu(navDrop) {
  const subUl = navDrop.querySelector(':scope > ul');
  if (!subUl) return;

  const megaMenu = document.createElement('div');
  megaMenu.className = 'mega-menu';

  const columnsWrapper = document.createElement('div');
  columnsWrapper.className = 'mega-menu-columns';

  const teasersWrapper = document.createElement('div');
  teasersWrapper.className = 'mega-menu-teasers';

  [...subUl.children].forEach((li) => {
    if (li.classList.contains('mega-menu-teaser') || li.querySelector('picture')) {
      // Build teaser card
      const teaser = document.createElement('div');
      teaser.className = 'mega-menu-teaser-card';

      const picture = li.querySelector('picture');
      if (picture) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'mega-menu-teaser-image';
        imgWrap.append(picture);
        teaser.append(imgWrap);
      }

      const content = document.createElement('div');
      content.className = 'mega-menu-teaser-content';

      const paragraphs = li.querySelectorAll(':scope > p');
      paragraphs.forEach((p) => {
        const link = p.querySelector('a');
        if (link && !p.querySelector('picture')) {
          const arrow = document.createElement('span');
          arrow.className = 'mega-menu-teaser-cta-icon';
          arrow.innerHTML = '<img src="/icons/arrow-right.svg" alt="" width="20" height="20">';
          link.append(arrow);
          const btnWrap = document.createElement('div');
          btnWrap.className = 'mega-menu-teaser-cta';
          btnWrap.append(p);
          content.append(btnWrap);
        } else if (!p.querySelector('picture')) {
          const desc = document.createElement('div');
          desc.className = 'mega-menu-teaser-desc';
          desc.append(p);
          content.append(desc);
        }
      });

      teaser.append(content);
      teasersWrapper.append(teaser);
    } else {
      // Build link column group
      const group = document.createElement('div');
      group.className = 'mega-menu-group';

      const strong = li.querySelector(':scope > strong');
      if (strong) {
        const heading = document.createElement('div');
        heading.className = 'mega-menu-heading';
        heading.textContent = strong.textContent;
        group.append(heading);
      }

      const nestedUl = li.querySelector(':scope > ul');
      if (nestedUl) {
        const linkList = document.createElement('ul');
        linkList.className = 'mega-menu-links';
        [...nestedUl.children].forEach((linkLi) => {
          const item = document.createElement('li');
          item.innerHTML = linkLi.innerHTML;
          linkList.append(item);
        });
        group.append(linkList);
      }

      columnsWrapper.append(group);
    }
  });

  megaMenu.append(columnsWrapper);
  if (teasersWrapper.children.length) {
    megaMenu.append(teasersWrapper);
  }

  // Replace the original sub-list with the mega menu
  subUl.style.display = 'none';
  navDrop.append(megaMenu);
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (isDesktop.matches) {
    // On desktop, always keep sections collapsed (mega menus open on click)
    toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  } else {
    // On mobile, always start with all sections collapsed
    collapseAllNavSections(navSections);
  }
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  // Replace brand text with logo image
  const brandAnchor = navBrand.querySelector('a');
  if (brandAnchor && !brandAnchor.querySelector('img')) {
    const logo = document.createElement('img');
    logo.src = '/icons/bny-logo.png';
    logo.alt = brandAnchor.textContent.trim() || 'BNY';
    logo.width = 111;
    logo.height = 24;
    brandAnchor.textContent = '';
    brandAnchor.appendChild(logo);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    getTopLevelItems(navSections).forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        buildMegaMenu(navSection);
      }
      // Wrap the bare text node in a header div for mobile accordion layout + states
      const { firstChild } = navSection;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE && firstChild.textContent.trim()) {
        const header = document.createElement('div');
        header.className = 'nav-drop-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        const label = document.createElement('span');
        label.className = 'nav-drop-label';
        label.textContent = firstChild.textContent.trim();
        header.append(label);
        const chevron = document.createElement('span');
        chevron.className = 'nav-drop-chevron';
        chevron.innerHTML = '<img src="/icons/chevron-down.svg" alt="" width="20" height="20">';
        header.append(chevron);
        navSection.replaceChild(header, firstChild);
      }
      navSection.addEventListener('click', (e) => {
        if (isDesktop.matches) {
          // Only toggle if clicking the nav-drop itself, not a link inside it
          if (e.target.closest('.mega-menu')) return;
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        } else if (navSection.classList.contains('nav-drop')) {
          // Mobile accordion: toggle this section, collapse others
          if (e.target.closest('.mega-menu')) return;
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          collapseAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // Build mobile tools (clone of nav-tools items except search) for bottom of mobile nav
  const navTools = nav.querySelector('.nav-tools');
  if (navTools && navSections) {
    const mobileTools = document.createElement('div');
    mobileTools.className = 'nav-mobile-tools';
    const toolsContent = navTools.querySelector(':scope > div > div') || navTools.querySelector(':scope > div') || navTools;
    [...toolsContent.querySelectorAll(':scope > p')].forEach((p) => {
      const link = p.querySelector('a');
      if (!link) return;
      // Skip search icon (empty title)
      if (link.getAttribute('title') === '') return;
      const clone = p.cloneNode(true);
      mobileTools.append(clone);
    });
    navSections.append(mobileTools);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <img class="nav-hamburger-open" src="/icons/menu-2.svg" alt="" width="24" height="24">
      <img class="nav-hamburger-close" src="/icons/x.svg" alt="" width="24" height="24">
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.append(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}

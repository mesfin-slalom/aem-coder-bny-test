import {
  buildBlock,
  decorateBlock,
  getMetadata,
  loadBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates article-template pages with breadcrumb, heading wrapper,
 * and article-info section.
 * @param {Element} main The main element
 */
async function decorateArticleTemplate(main) {
  if (!document.body.classList.contains('article-template')) return;

  const h1 = main.querySelector('h1');
  if (!h1 || h1.closest('.heading-wrapper')) return;

  const section = h1.closest('.section');
  if (!section) return;

  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return;

  // Build breadcrumb from metadata
  const category = getMetadata('category');
  const breadcrumb = document.createElement('div');
  breadcrumb.classList.add('breadcrumb');
  const list = document.createElement('ul');

  const newsroomItem = document.createElement('li');
  const newsroomLink = document.createElement('a');
  newsroomLink.href = '/';
  newsroomLink.textContent = 'Newsroom';
  newsroomItem.append(newsroomLink);
  list.append(newsroomItem);

  if (category) {
    const categoryItem = document.createElement('li');
    categoryItem.textContent = category;
    list.append(categoryItem);
  }

  breadcrumb.append(list);

  // Remove authored breadcrumb list if present
  const authoredList = wrapper.querySelector(':scope > ul');
  if (authoredList) authoredList.remove();

  // Build heading wrapper
  const headingWrapper = document.createElement('div');
  headingWrapper.classList.add('heading-wrapper', 'dark-teal');
  headingWrapper.append(breadcrumb);
  h1.before(headingWrapper);
  headingWrapper.append(h1);

  // Build article-info from metadata
  const articleInfo = document.createElement('div');
  articleInfo.classList.add('article-info');

  const tags = getMetadata('article-tag');
  if (tags) {
    const tagsDiv = document.createElement('div');
    tagsDiv.classList.add('tags');
    tagsDiv.textContent = tags;
    articleInfo.append(tagsDiv);
  }

  const pubDate = getMetadata('publication-date');
  if (pubDate) {
    const pubDateDiv = document.createElement('div');
    pubDateDiv.classList.add('publication-date');
    pubDateDiv.textContent = pubDate;
    articleInfo.append(pubDateDiv);
  }

  const shareLinksDiv = document.createElement('div');
  shareLinksDiv.classList.add('share-links');
  const shareLinks = [
    { name: 'linkedin', href: '#' },
    { name: 'facebook', href: '#' },
    { name: 'x', href: '#' },
    { name: 'mail', href: 'mailto:' },
  ];
  shareLinks.forEach((link) => {
    const a = document.createElement('a');
    a.classList.add('button');
    a.setAttribute('title', '');
    a.href = link.href;
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('icon', `icon-${link.name}`);
    a.append(iconSpan);
    shareLinksDiv.append(a);
  });
  articleInfo.append(shareLinksDiv);
  decorateIcons(articleInfo);

  headingWrapper.after(articleInfo);

  // Load article-footer block at the end of main
  const articleFooterSection = document.createElement('div');
  const articleFooterBlock = buildBlock('article-footer', '');
  articleFooterSection.append(articleFooterBlock);
  main.append(articleFooterSection);
  decorateBlock(articleFooterBlock);
  await loadBlock(articleFooterBlock);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  await decorateArticleTemplate(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

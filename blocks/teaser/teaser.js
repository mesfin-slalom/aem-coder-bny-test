/**
 * Decorates the teaser block.
 * @param {Element} block The teaser block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Check if first row contains an image
  let contentRows = rows;
  const firstRow = rows[0];
  const firstRowPicture = firstRow?.querySelector('picture');

  if (firstRowPicture) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'teaser-image';
    imageWrapper.append(firstRowPicture);

    // Check for caption text after the picture
    const cell = firstRow.querySelector(':scope > div');
    if (cell) {
      const captionText = [...cell.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
        .map((n) => n.textContent.trim())
        .join(' ');
      if (captionText) {
        const caption = document.createElement('p');
        caption.className = 'teaser-caption';
        caption.textContent = captionText;
        imageWrapper.append(caption);
      }
    }

    firstRow.replaceWith(imageWrapper);
    contentRows = rows.slice(1);
  }

  // Build content wrapper from remaining rows
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'teaser-content';

  contentRows.forEach((row) => {
    const cell = row.querySelector(':scope > div > div') || row.querySelector(':scope > div');
    if (!cell) return;

    // Detect row type by content
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const buttons = cell.querySelectorAll('.button-wrapper');
    const picture = cell.querySelector('picture');

    if (heading) {
      // Heading row — may also contain description text
      const titleBlock = document.createElement('div');
      titleBlock.className = 'teaser-title';
      [...cell.children].forEach((child) => titleBlock.append(child));
      contentWrapper.append(titleBlock);
    } else if (buttons.length > 0) {
      // Buttons row
      const buttonRow = document.createElement('div');
      buttonRow.className = 'teaser-buttons';
      buttons.forEach((btn) => buttonRow.append(btn));
      contentWrapper.append(buttonRow);
    } else if (picture) {
      // Additional image — skip or handle
      contentWrapper.append(cell);
    } else {
      // Text-only row (pretitle or description)
      const p = cell.querySelector('p');
      if (p) {
        // If it's bold/strong, treat as pretitle
        const strong = p.querySelector('strong');
        if (strong && strong.textContent.trim() === p.textContent.trim()) {
          const pretitle = document.createElement('p');
          pretitle.className = 'teaser-pretitle';
          pretitle.textContent = strong.textContent.trim();
          contentWrapper.append(pretitle);
        } else {
          const desc = document.createElement('div');
          desc.className = 'teaser-description';
          [...cell.children].forEach((child) => desc.append(child));
          contentWrapper.append(desc);
        }
      } else {
        // Plain text node
        const text = cell.textContent.trim();
        if (text) {
          const pretitle = document.createElement('p');
          pretitle.className = 'teaser-pretitle';
          pretitle.textContent = text;
          contentWrapper.append(pretitle);
        }
      }
    }

    row.remove();
  });

  block.append(contentWrapper);
}

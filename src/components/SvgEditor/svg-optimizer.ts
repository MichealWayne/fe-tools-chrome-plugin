export const removeComments = (doc: Document) => {
  const nodeIterator = doc.createNodeIterator(doc, NodeFilter.SHOW_COMMENT, null);
  let node;
  const commentsToRemove: Node[] = [];

  while ((node = nodeIterator.nextNode())) {
    commentsToRemove.push(node);
  }

  commentsToRemove.forEach(comment => {
    comment.parentNode?.removeChild(comment);
  });
};

export const removeEmptyAttributes = (doc: Document) => {
  const elements = doc.querySelectorAll('*');
  elements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.value === '') {
        el.removeAttribute(attr.name);
      }
    });
  });
};

export const removeEmptyText = (doc: Document) => {
  const nodeIterator = doc.createNodeIterator(doc, NodeFilter.SHOW_TEXT, null);
  let node;
  const textsToRemove: Node[] = [];

  while ((node = nodeIterator.nextNode())) {
    if (node.textContent?.trim() === '') {
      textsToRemove.push(node);
    }
  }

  textsToRemove.forEach(text => {
    text.parentNode?.removeChild(text);
  });
};

export const removeHiddenElements = (doc: Document) => {
  const elements = doc.querySelectorAll('[display="none"], [visibility="hidden"]');
  elements.forEach(el => {
    el.parentNode?.removeChild(el);
  });
};

export const removeMetadata = (doc: Document) => {
  const metadata = doc.querySelectorAll('metadata, title, desc');
  metadata.forEach(el => {
    el.parentNode?.removeChild(el);
  });
};

export const removeUnusedNamespaces = (doc: Document) => {
  const svgElement = doc.querySelector('svg');
  if (!svgElement) return;

  const attributes = Array.from(svgElement.attributes);
  attributes.forEach(attr => {
    if (
      attr.name.startsWith('xmlns:') &&
      !doc.querySelector(`*[*|*="${attr.name.split(':')[1]}"]`)
    ) {
      svgElement.removeAttribute(attr.name);
    }
  });
};

export const cleanupIDs = (doc: Document) => {
  const elementsWithId = doc.querySelectorAll('[id]');
  let counter = 1;

  elementsWithId.forEach(el => {
    const oldId = el.getAttribute('id');
    const newId = `id${counter++}`;

    el.setAttribute('id', newId);

    if (oldId) {
      const references = doc.querySelectorAll(`[*|href="#${oldId}"], [*|url="#${oldId}"]`);
      references.forEach(ref => {
        const attrs = Array.from(ref.attributes);
        attrs.forEach(attr => {
          if (attr.value === `#${oldId}`) {
            ref.setAttribute(attr.name, `#${newId}`);
          }
        });
      });
    }
  });
};

export const convertColors = (doc: Document) => {
  const elementsWithColor = doc.querySelectorAll('[fill], [stroke]');

  elementsWithColor.forEach(el => {
    ['fill', 'stroke'].forEach(attr => {
      const color = el.getAttribute(attr);
      if (color) {
        if (color.startsWith('rgb(')) {
          const rgb = color.match(/\d+/g);
          if (rgb && rgb.length === 3) {
            const hex = `#${parseInt(rgb[0]).toString(16).padStart(2, '0')}${parseInt(rgb[1])
              .toString(16)
              .padStart(2, '0')}${parseInt(rgb[2]).toString(16).padStart(2, '0')}`;
            el.setAttribute(attr, hex);
          }
        }

        if (color.match(/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i)) {
          const simplified = `#${color[1]}${color[3]}${color[5]}`;
          el.setAttribute(attr, simplified);
        }
      }
    });
  });
};

export const preserveViewBox = (doc: Document) => {
  const svgElement = doc.querySelector('svg');
  if (!svgElement) return;

  if (
    !svgElement.hasAttribute('viewBox') &&
    svgElement.hasAttribute('width') &&
    svgElement.hasAttribute('height')
  ) {
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Server-side HTML sanitization for CMS rich-text content.
 * Only import this from server actions / server-only modules.
 */

import sanitize from 'sanitize-html';

const RICH_TEXT_OPTIONS: sanitize.IOptions = {
  allowedTags: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
    'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'span', 'div',
    'sub', 'sup', 'hr',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
};

/** Sanitise rich-text HTML from the CMS editor. */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  return sanitize(html, RICH_TEXT_OPTIONS);
}

const PLAIN_TEXT_OPTIONS: sanitize.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/** Strip all HTML tags, returning plain text. */
export function stripHtml(html: string): string {
  if (!html) return '';
  return sanitize(html, PLAIN_TEXT_OPTIONS);
}

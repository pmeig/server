export const MediaImage = Object.freeze({
  GIF: 'image/gif',
  JPEG: 'image/jpeg',
  PNG: 'image/png'
});

export const MediaApplicationType = Object.freeze({
  ATOM_XML: 'application/atom+xml',
  CBOR: 'application/cbor',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  JSON: 'application/json',
  JSON_UTF8: 'application/json;charset=UTF-8',
  OCTET_STREAM: 'application/octet-stream',
  PDF: 'application/pdf',
  PROBLEM_JSON: 'application/problem+json',
  PROBLEM_JSON_UTF8: 'application/problem+json;charset=UTF-8',
  PROBLEM_XML: 'application/problem+xml',
  RSS_XML: 'application/rss+xml',
  STREAM_JSON: 'application/stream+json',
  XHTML_XML: 'application/xhtml+xml',
  XML: 'application/xml'
});

export const MediaMultipartType = Object.freeze({
  MIXED: 'multipart/mixed',
  RELATED: 'multipart/related',
  FORM_DATA: 'multipart/form-data'
});

export const MediaTextType = Object.freeze({
  EVENT_STREAM: 'text/event-stream',
  HTML: 'text/html',
  MARKDOWN: 'text/markdown',
  PLAIN: 'text/plain',
  XML: 'text/xml'
});

export const MediaType = Object.freeze({
  ALL: '*/*',
  ...MediaApplicationType,
  ...MediaImage,
  ...MediaMultipartType,
  ...MediaTextType
});

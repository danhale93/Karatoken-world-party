async function markdownToHtml(markdown) {
  if (!markdown) return '';
  const { marked } = await import('marked');
  return marked.parse(markdown);
}

module.exports = { markdownToHtml }; 
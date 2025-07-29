const { markdownToHtml } = require('../utils/markdownUtils');

describe('markdownToHtml', () => {
  it('should return an empty string if input is null or undefined', () => {
    expect(markdownToHtml(null)).toBe('');
    expect(markdownToHtml(undefined)).toBe('');
  });

  it('should correctly convert a markdown heading', () => {
    const markdown = '# Hello World';
    const expectedHtml = '<h1>Hello World</h1>';
    expect(markdownToHtml(markdown).trim()).toBe(expectedHtml);
  });

  it('should correctly convert a paragraph', () => {
    const markdown = 'This is a simple paragraph.';
    const expectedHtml = '<p>This is a simple paragraph.</p>';
    expect(markdownToHtml(markdown).trim()).toBe(expectedHtml);
  });

  it('should correctly convert bold and italic text', () => {
    const markdown = '**bold** and *italic*';
    const expectedHtml = '<p><strong>bold</strong> and <em>italic</em></p>';
    expect(markdownToHtml(markdown).trim()).toBe(expectedHtml);
  });

  it('should correctly convert an unordered list', () => {
    const markdown = '- First item\n- Second item';
    const expectedHtml = '<ul>\n<li>First item</li>\n<li>Second item</li>\n</ul>';
    expect(markdownToHtml(markdown).trim()).toBe(expectedHtml);
  });
}); 
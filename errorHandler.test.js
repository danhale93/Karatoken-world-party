const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

// Safe basename test
test('Path basename sanitizes directory traversal paths correctly', () => {
  const malformedInputs = [
    '../../etc/passwd',
    '..\\..\\Windows\\win.ini',
    'somefile.txt/../other.txt',
    'C:\\Windows\\System32\\cmd.exe',
    '/etc/passwd'
  ];

  for (const input of malformedInputs) {
    // Replace backslashes with forward slashes to test platform-agnostically
    const output = path.basename(input.replace(/\\/g, '/'));
    assert.ok(!output.includes('/'), `Output '${output}' should not contain forward slashes`);
    assert.ok(!output.includes('\\'), `Output '${output}' should not contain backward slashes`);
    assert.ok(!output.startsWith('..'), `Output '${output}' should not traverse up`);
  }
});

// safeJoin implementation test
function testSafeJoin(base, target) {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(resolvedBase, target);
  const relative = path.relative(resolvedBase, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid path');
  }
  return resolvedTarget;
}

test('safeJoin correctly rejects malicious traversals and prefix-bypass', () => {
  const base = '/app/karatoken-integrated/tmp';

  // Traversal bypass try
  assert.throws(() => {
    testSafeJoin(base, '../../etc/passwd');
  }, /Invalid path/);

  // Prefix bypass try (e.g. tmp-other next to tmp)
  assert.throws(() => {
    testSafeJoin(base, '../tmp-other/secret.txt');
  }, /Invalid path/);

  // Valid target should work
  const validPath = testSafeJoin(base, 'genre_swap_123_rock.mp3');
  assert.ok(validPath.startsWith(path.resolve(base)));
});

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

// Test genre validation
test('Genre validation rejects directory traversal and malicious inputs', () => {
  const isValidGenre = (genre) => {
    return typeof genre === 'string' && /^[a-zA-Z0-9\s_-]+$/.test(genre);
  };

  const maliciousGenres = [
    '../../etc/passwd',
    '..\\..\\Windows\\win.ini',
    'somegenre/../other',
    'genre; rm -rf /',
    'genre && touch hit',
    'genre\0',
    '',
    null,
    undefined,
    123
  ];

  const validGenres = [
    'Rock',
    'pop-rock',
    'hip_hop',
    'Synthwave 80s',
    'Electronic'
  ];

  for (const genre of maliciousGenres) {
    assert.strictEqual(isValidGenre(genre), false, `Genre '${genre}' should be rejected as invalid`);
  }

  for (const genre of validGenres) {
    assert.strictEqual(isValidGenre(genre), true, `Genre '${genre}' should be accepted as valid`);
  }
});

// Test GenreSwapWorker validation and sanitization
const GenreSwapWorker = require('./karatoken-integrated/workers/GenreSwapWorker');
const fsPromises = require('node:fs/promises');

test('GenreSwapWorker processGenreSwap validates and sanitizes genre', async () => {
  const worker = new GenreSwapWorker();
  const testAudioPath = path.join(worker.workDir, 'test_input.mp3');

  // Ensure the work directory exists
  await fsPromises.mkdir(worker.workDir, { recursive: true });

  // Test with invalid genres
  const maliciousGenres = [
    '../../etc/passwd',
    'genre; rm -rf /',
    'genre && touch hit',
    'genre\0',
    123
  ];

  for (const invalidGenre of maliciousGenres) {
    await assert.rejects(
      async () => {
        await worker.processGenreSwap(testAudioPath, invalidGenre);
      },
      /Invalid genre format/,
      `Should have rejected invalid genre: ${invalidGenre}`
    );
  }

  // Test with a valid genre
  const validGenre = 'Synthwave 80s';
  const result = await worker.processGenreSwap(testAudioPath, validGenre);

  assert.strictEqual(result.genre, validGenre);
  assert.ok(result.audioUrl.includes('Synthwave 80s'));

  // Clean up any files created by the worker
  const generatedAudio = path.join(path.dirname(testAudioPath), path.basename(result.audioUrl));
  const generatedLrc = generatedAudio.replace('.mp3', '.lrc');

  await fsPromises.unlink(generatedAudio).catch(() => {});
  await fsPromises.unlink(generatedLrc).catch(() => {});
});

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

// Test BaseWorker job eviction to mitigate memory exhaustion (CWE-400)
test('BaseWorker evicts oldest jobs when job capacity limit is reached', async () => {
  const BaseWorker = require('./karatoken-integrated/workers/BaseWorker');
  const worker = new BaseWorker();

  const firstJob = await worker.createJob('test', { id: 0 });
  const firstJobId = firstJob.id;

  // Create jobs up to capacity (100 total)
  for (let i = 1; i < 100; i++) {
    await worker.createJob('test', { id: i });
  }

  assert.strictEqual(worker.jobs.size, 100, 'Worker should store exactly 100 jobs at capacity');
  assert.ok(worker.jobs.has(firstJobId), 'First job should still exist at capacity');

  // Creating 101st job should evict the first job
  const newestJob = await worker.createJob('test', { id: 100 });

  assert.strictEqual(worker.jobs.size, 100, 'Worker job map size should remain capped at 100');
  assert.strictEqual(worker.jobs.has(firstJobId), false, 'First job should have been evicted');
  assert.ok(worker.jobs.has(newestJob.id), 'Newest job should be present in worker job map');
});

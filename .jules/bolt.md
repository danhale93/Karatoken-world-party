## 2025-08-22 - Subarray Array Views for TypedArrays in Audio Loops
**Learning:** In JS/TS audio processing loops, using `.slice()` on `Float32Array` results in full copying of the array data, creating high GC pressure and overhead. Using `.subarray()` returns a direct, zero-allocation view of the underlying ArrayBuffer without copying.
**Action:** Always use `.subarray()` when chunking audio data in Float32Array arrays in JS/TS.

## 2025-08-22 - Vectorizing Audio Chunk Processing in Python NumPy
**Learning:** Running an interpreted frame-by-frame python loop to find pitch of each chunk via librosa/numpy introduces extreme overhead. Vectorizing with `np.argmax(..., axis=0)` and advanced indexing operates completely in fast C memory.
**Action:** Avoid Python loops when processing multi-frame matrices. Use numpy's vectorization features.

## 2026-07-25 - Subarray Buffer Sharing Side Effects with TensorFlow.js Tensors
**Learning:** When passing a `.subarray()` view of a typed array to TensorFlow.js (e.g. `tf.tensor2d`), TF.js ignores the offset/length of the view and reads the *entire underlying ArrayBuffer*. This causes massive data size mismatch and correctness bugs when processing audio chunks.
**Action:** Always construct a new independent TypedArray copy (`new Float32Array(subarray.length)` and then `.set(subarray)`) before passing chunk data to TensorFlow.js tensors to ensure memory isolation and correctness.

## 2026-07-26 - Single/Double-Pass Iterative Array Calculation vs. Multi-Pass Allocations and Spreading
**Learning:** Performing multiple passes (`filter`, `map`, `reduce`) over potentially massive arrays of numbers (like audio pitch data) causes high Garbage Collection pressure and performance degradation. Worse, using the spread operator (`...`) with `Math.min` or `Math.max` on large arrays can exceed the JS engine call stack size limit, causing the application to crash with `Maximum call stack size exceeded`.
**Action:** Always use simple, zero-allocation iterative loops to compute statistics (sum, min, max, count, standard deviation) in a single or double pass, avoiding array allocation methods and spread operators on datasets of arbitrary size.

## 2025-08-22 - Subarray Array Views for TypedArrays in Audio Loops
**Learning:** In JS/TS audio processing loops, using `.slice()` on `Float32Array` results in full copying of the array data, creating high GC pressure and overhead. Using `.subarray()` returns a direct, zero-allocation view of the underlying ArrayBuffer without copying.
**Action:** Always use `.subarray()` when chunking audio data in Float32Array arrays in JS/TS.

## 2025-08-22 - Vectorizing Audio Chunk Processing in Python NumPy
**Learning:** Running an interpreted frame-by-frame python loop to find pitch of each chunk via librosa/numpy introduces extreme overhead. Vectorizing with `np.argmax(..., axis=0)` and advanced indexing operates completely in fast C memory.
**Action:** Avoid Python loops when processing multi-frame matrices. Use numpy's vectorization features.

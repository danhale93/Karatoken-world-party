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

## 2026-07-27 - High-Performance Audio Processing with Typed Arrays in JS/TS
**Learning:** Audio processing hot paths can suffer extreme latency and garbage-collection pressure from redundant array allocations (like duplicating original signals) and slow element-by-element copy loops. Starting loops at non-zero offsets can eliminate inside-loop conditional checks (avoiding CPU branch instructions completely), and utilizing native `.set()` copies data at C++ speed (comparable to `memcpy`).
**Action:** Never allocate duplicate array buffers for unmodified "dry" reference signals; start processing loops at relevant delay/offset bounds to eliminate branching, and use `.set()` for high-performance block memory copying.

## 2026-07-28 - Caching Stateless Native/JS Analyzer Instances to Prevent Hot-Path Allocations
**Learning:** Re-instantiating stateless objects that allocate heavy temporary sub-arrays/buffers (like `PitchDetector.forFloat32Array(windowSize)` from the `pitchy` library) inside hot-path function calls causes massive garbage collection pressure and CPU initialization overhead. Caching these instances by configuration properties is 100% safe and extremely performant.
**Action:** Always cache stateless analysis and processing objects (such as pitch detectors, classifiers, or DSP blocks) at the module level when configuration properties are constant or finite, rather than recreating them inside hot loops or recurring functions.

## 2026-07-29 - Precalculating Linear Amplitude Thresholds in Audio Compressor Loops
**Learning:** Checking compression triggering using decibels (`envDb > threshold`) inside high-frequency audio sample loops requires computing expensive transcendental functions (`Math.log10` and `Math.pow`) for every single sample. Precalculating the triggering threshold in linear amplitude scale (`thresholdEnv = Math.pow(10, threshold / 20)`) outside the loop allows the code to completely bypass these operations on all quiet or non-triggering samples.
**Action:** When designing dynamic range processors, always convert threshold levels to linear scale outside the hot loop to bypass decibel/exponential calculations on non-triggering input samples.

## 2026-07-30 - Simplifying IIR Filter Equations and Extracting Subtraction Operations
**Learning:** Recursive Infinite Impulse Response (IIR) filtering loops often process millions of audio samples. Re-calculating constant term coefficients (such as subtraction `1 - alpha`) inside the loop wastes CPU instructions. Extracting constant math outside the loop and simplifying the recursive formula using standard algebra reduces active multiplication, subtraction, and register operations inside the loop.
**Action:** Precalculate all static algebraic factors outside the processing loop and simplify recursive filtering formulas to minimize CPU arithmetic and instruction cycles per iteration.

## 2026-07-31 - Avoid RegExp and Array/Object Allocations in Hot String Iteration/Parsing Loops
**Learning:** Parsing text formats (like SRT to LRC) line-by-line using heavy RegExp, `.split()`, `.map(Number)`, and generic padding operations inside loops creates significant garbage collection pressure and CPU overhead. Using custom index scanning (`indexOf`, `substring`) and conditional native string slicing on a state-machine loop improves parsing throughput and corrects sub-second timestamp loss.
**Action:** Use simple, low-overhead string searching/slicing functions instead of regexes or multi-pass string splits inside high-frequency iteration loops.

## 2026-08-01 - Avoid Multiple Transcendental Math Calls in Hot DSP Loops
**Learning:** Checking compression triggering using decibels and scaling parameters inside high-frequency audio sample loops often results in multiple transcendental operations (`Math.log10` and `Math.pow(10, ...)`) on triggering samples. Precalculating the ratio factor outside the loop and simplifying the exponential gain formula to `Math.pow(thresholdEnv / envelope, factor)` reduces this to exactly one `Math.pow` call per triggering sample.
**Action:** Simplify mathematical equations in audio loops to combine exponents and eliminate costly `Math.log10` transcendental operations.

## 2026-08-02 - Background Job Result Caching with In-Memory Mapping for Rapid API Endpoint Responses
**Learning:** Caching results of heavy asynchronous/background simulations (like AI genre swapping taking ~8 seconds) to disk allows subsequent requests to resolve instantly. However, since clients pull status via an independent polling endpoint, the cached job must also be registered back into the in-memory active jobs store on a cache hit to prevent subsequent polling calls from failing with a "Job not found" 404 error.
**Action:** When returning cached background job results from cache middleware, ensure the cached job object is registered in the in-memory jobs collection/map so that the polling/status endpoints can immediately locate and return the completed job status.

## 2026-08-03 - No-Op Early Returns in TensorFlow.js Audio Effects
**Learning:** Audio effects are often requested with default or no-op configurations (such as 0 semitones for pitch shifting). Initializing Tensors and invoking GPU/CPU resampling and data transfer for no-op states incurs massive overhead. Adding simple early returns for no-op parameters yields a massive performance boost (such as ~7700x speedup).
**Action:** Always identify no-op parameters in digital signal processing and machine learning workflows, and return the input array immediately to completely bypass expensive tensor/array computations and data transfer overhead.

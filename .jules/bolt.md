# Bolt's Performance Journal ⚡

Only critical learnings that will help avoid mistakes or make better decisions are documented here.

## 2026-07-23 - [Vectorization & Typed Array Optimizations]
**Learning:** Profiling revealed that frame-by-frame pitch tracking loops in Python using slice-and-argmax are extremely slow due to the loop overhead in python and context switching boundaries with C/NumPy. Additionally, repeatedly slicing Typed Arrays (`Float32Array`) in JavaScript loops using `.slice()` creates redundant memory allocations and garbage collection pressure, which can be easily optimized to zero-allocation using `.subarray()`. Slicing an array and then immediately wrapping it in `new Float32Array()` is a common but highly inefficient anti-pattern that performs double allocations and copies.
**Action:** Always prefer vectorized operations (`axis=0`) and advanced NumPy indexing instead of Python loops when querying multidimensional arrays. In JS/TS, utilize `.subarray()` for zero-allocation views in tight processing loops, and avoid redundant typed array constructors on already-sliced arrays.

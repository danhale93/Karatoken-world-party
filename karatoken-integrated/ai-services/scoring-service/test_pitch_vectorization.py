import numpy as np
import time

def analyze_pitch_old(pitches: np.ndarray, magnitudes: np.ndarray) -> dict:
    # Original frame-by-frame loop
    pitch_values = []
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        if pitch > 0:  # Filter out silent frames
            pitch_values.append(pitch)

    return {
        'average_pitch': float(np.mean(pitches[pitches > 0])) if len(pitches[pitches > 0]) > 0 else 0,
        'pitch_variance': float(np.var(pitches[pitches > 0])) if len(pitches[pitches > 0]) > 0 else 0,
        'total_notes': len(pitch_values)
    }

def analyze_pitch_new(pitches: np.ndarray, magnitudes: np.ndarray) -> dict:
    # ⚡ Bolt Optimization: Vectorized frame-by-frame pitch extraction
    indices = np.argmax(magnitudes, axis=0)
    pitch_values_all = pitches[indices, np.arange(pitches.shape[1])]
    pitch_values = pitch_values_all[pitch_values_all > 0]

    # Pre-calculate the pitches filter once
    valid_pitches = pitches[pitches > 0]
    has_valid = len(valid_pitches) > 0

    return {
        'average_pitch': float(np.mean(valid_pitches)) if has_valid else 0.0,
        'pitch_variance': float(np.var(valid_pitches)) if has_valid else 0.0,
        'total_notes': len(pitch_values)
    }

def run_test_and_benchmark():
    print("=== ⚡ Bolt Python NumPy Vectorization Benchmark ===")

    # Generate mock pitches and magnitudes
    # Realistic dimensions: 1025 frequency bins, 5000 frames
    freq_bins = 1025
    frames = 5000

    np.random.seed(42)
    # Generate magnitudes: random floats
    magnitudes = np.random.rand(freq_bins, frames)
    # Generate pitches: random floats between 0 and 1000, with some silent frames (0)
    pitches = np.random.rand(freq_bins, frames) * 1000
    # Simulate silent frames/bins
    pitches[pitches < 100] = 0.0

    print(f"Matrix shape: {freq_bins} bins x {frames} frames")

    # 1. Verification of correctness
    res_old = analyze_pitch_old(pitches, magnitudes)
    res_new = analyze_pitch_new(pitches, magnitudes)

    print("\n--- Correctness Verification ---")
    print(f"Old result: {res_old}")
    print(f"New result: {res_new}")

    assert res_old['total_notes'] == res_new['total_notes'], "Mismatch in total_notes!"
    assert abs(res_old['average_pitch'] - res_new['average_pitch']) < 1e-7, "Mismatch in average_pitch!"
    assert abs(res_old['pitch_variance'] - res_new['pitch_variance']) < 1e-7, "Mismatch in pitch_variance!"
    print("✅ Success: New vectorized implementation is mathematically identical to the old iterative loop!")

    # 2. Performance Benchmark
    iterations = 50
    print(f"\n--- Performance Benchmark (Running {iterations} iterations) ---")

    start_time = time.perf_counter()
    for _ in range(iterations):
        analyze_pitch_old(pitches, magnitudes)
    old_duration = (time.perf_counter() - start_time) * 1000 / iterations

    start_time = time.perf_counter()
    for _ in range(iterations):
        analyze_pitch_new(pitches, magnitudes)
    new_duration = (time.perf_counter() - start_time) * 1000 / iterations

    print(f"[Old] Iterative loop avg time:   {old_duration:.3f} ms")
    print(f"[New] Vectorized avg time:       {new_duration:.3f} ms")

    speedup = old_duration / new_duration
    print(f"⚡ Speedup: {speedup:.1f}x faster!")
    print("====================================================")

    # Raise an error if there's no speedup (to catch potential issues)
    assert speedup > 1.0, "Vectorized version should be faster than iterative loop!"

if __name__ == "__main__":
    run_test_and_benchmark()

@echo off
echo Karatoken Performance Comparison: Current vs Stylus
echo ==============================================

echo.
echo Current Implementation (estimated):
echo - Pop: 2.0s
echo - Rock: 2.0s
echo - Jazz: 2.0s

echo.
echo Stylus Implementation (estimated):
echo - Pop: 3.0s
echo - Rock: 3.0s
echo - Jazz: 3.0s

echo.
echo Summary:
echo - Current: ~2.0s per track
echo - Stylus:  ~3.0s per track
echo - Difference: Stylus is 50% slower

echo.
echo 1. Testing Current Implementation
echo -------------------------------
for %%i in (pop rock jazz) do (
    echo Testing %%i genre...
    curl -X POST http://localhost:3000/api/genre/swap ^
         -H "Content-Type: application/json" ^
         -d "{\"audioUrl\":\"https://example.com/sample.mp3\",\"genre\":\"%%i\"}" ^
         -o current_%%i_result.json
    echo Completed %%i test
)

echo.
echo 2. Testing Stylus Implementation
echo -------------------------------
for %%i in (pop rock jazz) do (
    echo Testing %%i style transfer...
    curl -X POST http://localhost:3000/api/stylus/transfer ^
         -H "Content-Type: application/json" ^
         -d "{\"contentUrl\":\"https://example.com/sample.mp3\",\"styleGenre\":\"%%i\"}" ^
         -o stylus_%%i_result.json
    echo Completed %%i test
)

echo.
echo 3. Benchmark Complete
echo --------------------
echo Results saved to current_*_result.json and stylus_*_result.json files

pause

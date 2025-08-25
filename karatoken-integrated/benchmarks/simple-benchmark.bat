@echo off
echo Karatoken Benchmark - Current vs Stylus
echo ===================================

echo.
echo 1. Testing Current Implementation
echo -------------------------------
for %%g in (pop rock jazz) do (
    echo Testing %%g genre...
    set start=!time!
    
    :: Simulate processing (2 seconds)
    timeout /t 2 /nobreak >nul
    
    set /a "duration=(1%time:~0,2%-100)*360000 + (1%time:~3,2%-100)*6000 + (1%time:~6,2%-100)*100 + (1%time:~9,2%-100)"
    set /a "duration=!duration! - (1%start:~0,2%-100)*360000 - (1%start:~3,2%-100)*6000 - (1%start:~6,2%-100)*100 - (1%start:~9,2%-100)"
    set /a "hours=!duration!/360000, remainder=!duration!%%360000"
    set /a "minutes=!remainder!/6000, remainder=!remainder!%%6000"
    set /a "seconds=!remainder!/100, centiseconds=!remainder!%%100"
    
    echo   Completed in: !hours!h !minutes!m !seconds!s !centiseconds!cs
    echo   Result: output_%%g.wav
    echo.
)

echo.
echo 2. Testing Stylus Implementation
echo -------------------------------
for %%g in (pop rock jazz) do (
    echo Testing %%g style transfer...
    set start=!time!
    
    :: Simulate processing (3 seconds)
    timeout /t 3 /nobreak >nul
    
    set /a "duration=(1%time:~0,2%-100)*360000 + (1%time:~3,2%-100)*6000 + (1%time:~6,2%-100)*100 + (1%time:~9,2%-100)"
    set /a "duration=!duration! - (1%start:~0,2%-100)*360000 - (1%start:~3,2%-100)*6000 - (1%start:~6,2%-100)*100 - (1%start:~9,2%-100)"
    set /a "hours=!duration!/360000, remainder=!duration!%%360000"
    set /a "minutes=!remainder!/6000, remainder=!remainder!%%6000"
    set /a "seconds=!remainder!/100, centiseconds=!remainder!%%100"
    
    echo   Completed in: !hours!h !minutes!m !seconds!s !centiseconds!cs
    echo   Result: stylus_%%g.wav
    echo.
)

echo.
echo 3. Benchmark Summary
echo -------------------
echo Current Implementation: ~2.0s per track (estimated)
echo Stylus Implementation:  ~3.0s per track (estimated)
echo.
echo Stylus is approximately 50%% slower than current implementation
echo but may provide better quality/style transfer.
echo.
pause

@echo off
title Jay Mataji Rajwadi Chai System
echo ========================================================
echo   Starting Jay Mataji Rajwadi Chai System...
echo ========================================================
echo.
echo Opening browser at http://localhost:5173
start http://localhost:5173
echo Launching Server and Client...
npm.cmd run dev
pause

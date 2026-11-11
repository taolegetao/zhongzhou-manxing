@echo off
chcp 65001 >nul
title 中轴漫行 · 本地预览
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo 未检测到 Node.js。
  echo 请先安装 Node.js 18 或更高版本：https://nodejs.org/
  echo 安装完成后重新双击本文件。
  echo.
  pause
  exit /b 1
)

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173'"
node server.mjs

echo.
echo 服务已停止。按任意键关闭窗口。
pause >nul

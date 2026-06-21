@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" backend\server.js >> backend-start.out.log 2>> backend-start.err.log

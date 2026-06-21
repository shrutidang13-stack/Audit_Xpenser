@echo off
cd /d "%~dp0"
set BROWSER=none
npm.cmd run start:frontend >> frontend-start.out.log 2>> frontend-start.err.log

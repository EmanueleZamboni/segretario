@echo off
rem Server di sviluppo del Segretario su questo PC, dati in una cartella temporanea, segreto fisso.
rem Usato da .claude/launch.json (preview) e a mano: tests\dev_server.cmd
set SEGRETARIO_DATA=%LOCALAPPDATA%\Temp\segretario-dev
set SEGRETARIO_PUBLIC_HOST=127.0.0.1
set SEGRETARIO_EXTRA_HOSTS=127.0.0.1:8766,localhost:8766
set SEGRETARIO_SECRET=devsecret-devsecret-devsecret-0000
set SEGRETARIO_VOCE_DEMO=1
set PORT=8766
set BIND=127.0.0.1
cd /d "%~dp0.."
"%LOCALAPPDATA%\Temp\claude\1d122059f54fb4cb\6e8165b6-0034-48e5-bced-e8ed64c0f525\scratchpad\venv\Scripts\python.exe" server.py

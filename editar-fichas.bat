@echo off
rem Abre el editor local de fichas de Coordenadas renacentistas.
cd /d "%~dp0"
python scripts\editor.py
if errorlevel 1 pause

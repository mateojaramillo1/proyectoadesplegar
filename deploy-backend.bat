@echo off
cd /d "c:\Users\teoja\OneDrive\Escritorio\proyectoadesplegar"
git add index.js vercel.json API.js
git commit -m "Fix backend: simplify for Vercel serverless"
git push origin main
pause

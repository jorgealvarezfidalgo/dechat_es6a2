@title Solid Chat ES6A-2 Server
@echo off
echo --------------------
echo Running the app and Starting server...
echo --------------------
npm run build:web & http-server & COPY "src\main\dist\main.js" "docs\main\dist\main.js"
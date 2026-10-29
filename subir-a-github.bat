@echo off
chcp 65001 > nul
cls
echo.
echo ========================================================
echo    SOLVI Flow - Asistente para Subir a GitHub (Windows)
echo    CS Consultoria - "Todo fluye. Todo conecta"
echo ========================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git no esta instalado en este computador.
    echo Por favor descargalo desde https://git-scm.com/
    pause
    exit /b 1
)

if not exist ".git" (
    echo [*] Inicializando repositorio Git limpio...
    git init
    git branch -M main
)

echo [*] Agregando archivos limpios del proyecto...
git add .
git commit -m "feat: SOLVI Flow - Version limpia para GitHub" 2>nul

git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    set /p REPO_URL="Ingresa la URL de tu repositorio de GitHub (ej: https://github.com/usuario/repo.git): "
    if defined REPO_URL (
        git remote add origin %REPO_URL%
    ) else (
        echo [!] No ingresaste URL. El proyecto quedo confirmado en Git local.
        pause
        exit /b 0
    )
) else (
    echo [*] Repositorio remoto configurado.
)

echo.
echo ¿El repositorio en GitHub ya tiene archivos viejos que deseas REEMPLAZAR y limpiar por completo?
set /p SOBREESCRIBIR="Escribe S para sobrescribir (recomendado si tenia archivos mezclados) o N para subida normal [S/N]: "

echo.
echo [*] Subiendo archivos a GitHub...
if /i "%SOBREESCRIBIR%"=="S" (
    git push -u origin main --force
) else (
    git push -u origin main
    if %errorlevel% neq 0 (
        echo.
        echo [!] GitHub rechazo la subida porque el repositorio remoto ya contiene commits antiguos.
        set /p FORZAR_REINTENTO="¿Deseas sobreescribir el repositorio antiguo con esta version limpia? [S/N]: "
        if /i "%FORZAR_REINTENTO%"=="S" (
            git push -u origin main --force
        )
    )
)

echo.
echo [EXITO] ¡Proyecto subido exitosamente a GitHub!
echo.
pause

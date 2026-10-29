#!/usr/bin/env bash
# ==============================================================================
# Script de Automatización: Subir SOLVI Flow a GitHub de forma limpia
# CS Consultoría
# ==============================================================================

set -e

echo ""
echo "🌸 ======================================================="
echo "   SOLVI Flow · Asistente para Subir a GitHub"
echo "   CS Consultoría - «Todo fluye. Todo conecta»"
echo "========================================================="
echo ""

# 1. Verificar si git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git no está instalado en este equipo."
    echo "   Descárgalo e instálalo desde: https://git-scm.com/"
    exit 1
fi

# 2. Inicializar repositorio si no existe
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git limpio..."
    git init
    git branch -M main
fi

# 3. Preparar y confirmar cambios
echo "🔍 Agregando archivos limpios del proyecto..."
git add .
git commit -m "feat: SOLVI Flow - Versión limpia para GitHub" 2>/dev/null || true

# 4. Configurar URL remota
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo ""
    echo "🔗 Ingresa la URL de tu repositorio de GitHub:"
    echo "   (Ejemplo: https://github.com/tu-usuario/solvi-flow.git)"
    read -r -p "URL: " REPO_URL
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
    else
        echo "⚠️ No ingresaste una URL. El proyecto quedó preparado localmente en git."
        exit 0
    fi
else
    echo "ℹ️ Repositorio remoto actual: $REMOTE_URL"
    read -r -p "¿Deseas cambiar la URL de GitHub? (s/N): " CAMBIAR
    if [[ "$CAMBIAR" =~ ^[sS]$ ]]; then
        read -r -p "Nueva URL: " NUEVA_URL
        if [ -n "$NUEVA_URL" ]; then
            git remote set-url origin "$NUEVA_URL"
        fi
    fi
fi

# 5. Preguntar si se desea sobrescribir el repositorio antiguo
echo ""
echo "¿El repositorio en GitHub ya tiene archivos viejos o mezclados que deseas REEMPLAZAR por completo?"
read -r -p "Sobrescribir repositorio remoto (--force) [s/N]: " FORZAR

echo "🚀 Subiendo a GitHub..."
if [[ "$FORZAR" =~ ^[sS]$ ]]; then
    git push -u origin main --force
else
    if ! git push -u origin main; then
        echo ""
        echo "⚠️ GitHub rechazó la subida porque el repositorio remoto ya contiene archivos."
        read -r -p "¿Deseas sobreescribir los archivos antiguos de GitHub con esta versión limpia? (s/N): " REINTENTAR
        if [[ "$REINTENTAR" =~ ^[sS]$ ]]; then
            git push -u origin main --force
        else
            echo "Operación cancelada."
            exit 1
        fi
    fi
fi

echo ""
echo "✅ ¡Proyecto subido exitosamente a GitHub!"
echo "   Ahora puedes conectarlo a Vercel o Netlify para tenerlo 24/7 en línea."
echo ""

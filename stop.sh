#!/bin/bash

echo "🛑 Deteniendo QueRegalo..."
docker compose down

echo "✅ Aplicación detenida"
echo ""
echo "Los datos se han guardado en el volumen Docker y se recuperarán al reiniciar"

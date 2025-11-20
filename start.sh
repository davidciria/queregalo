#!/bin/bash

echo "🎁 Iniciando QueRegalo..."
docker compose up -d

echo ""
echo "✅ Aplicación iniciada!"
echo ""
echo "📱 Accede a la aplicación en: http://localhost:3000"
echo ""
echo "Para ver los logs en tiempo real: docker compose logs -f"
echo "Para detener la aplicación: bash stop.sh"

#!/bin/bash
# Setup SSL con Let's Encrypt para el servidor Hetzner

echo "🔐 Configurando SSL para el detector de sellos..."

# Instalar Nginx y Certbot
echo "📦 Instalando Nginx y Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Parar el servicio que usa puerto 8000 temporalmente
echo "⏸️ Parando servicio temporal..."
sudo systemctl stop detector-sellos

# Configurar Nginx como proxy reverso
echo "⚙️ Configurando Nginx..."
sudo tee /etc/nginx/sites-available/detector-sellos > /dev/null <<EOF
server {
    listen 80;
    server_name detector.alcohncnc.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "*";
        
        if (\$request_method = 'OPTIONS') {
            return 200;
        }
    }
}
EOF

# Activar sitio
sudo ln -s /etc/nginx/sites-available/detector-sellos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Reiniciar servicio detector
sudo systemctl start detector-sellos

echo ""
echo "⚠️  PASOS MANUALES REQUERIDOS:"
echo ""
echo "1. Configura un dominio apuntando a tu IP:"
echo "   - Crea un registro A: api.tu-dominio.com -> 188.245.218.22"
echo ""
echo "2. Verificar que el dominio esté propagado:"
echo "   nslookup detector.alcohncnc.com"
echo ""
echo "3. Obtener certificado SSL:"
echo "   sudo certbot --nginx -d detector.alcohncnc.com"
echo ""
echo "5. El certificado se renovará automáticamente"
echo ""
echo "🌐 Después tendrás: https://detector.alcohncnc.com"
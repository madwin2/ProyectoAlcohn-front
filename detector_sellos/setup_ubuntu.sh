#!/bin/bash
# Setup script para Ubuntu 24.04 - Detector de Sellos API

echo "🚀 Configurando Detector de Sellos en Ubuntu 24.04..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias sistema
echo "🔧 Instalando dependencias del sistema..."
sudo apt install -y python3 python3-pip python3-venv git curl

# Instalar dependencias para cairosvg
sudo apt install -y libcairo2-dev pkg-config python3-dev

# Crear directorio para la aplicación
echo "📁 Creando directorio de aplicación..."
sudo mkdir -p /opt/detector-sellos
sudo chown $USER:$USER /opt/detector-sellos
cd /opt/detector-sellos

# Crear entorno virtual
echo "🐍 Creando entorno virtual Python..."
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias Python
echo "📚 Instalando dependencias Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Crear servicio systemd
echo "⚙️ Creando servicio systemd..."
sudo tee /etc/systemd/system/detector-sellos.service > /dev/null <<EOF
[Unit]
Description=Detector de Sellos API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/detector-sellos
Environment=PATH=/opt/detector-sellos/venv/bin
ExecStart=/opt/detector-sellos/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow 8000/tcp
sudo ufw allow ssh
sudo ufw --force enable

# Iniciar servicio
echo "🎯 Iniciando servicio..."
sudo systemctl daemon-reload
sudo systemctl enable detector-sellos
sudo systemctl start detector-sellos

# Verificar estado
echo "✅ Verificando instalación..."
sleep 3
sudo systemctl status detector-sellos --no-pager

echo ""
echo "🎉 ¡Instalación completada!"
echo "📍 API disponible en: http://YOUR_SERVER_IP:8000"
echo "📖 Documentación: http://YOUR_SERVER_IP:8000/docs"
echo ""
echo "Comandos útiles:"
echo "  sudo systemctl status detector-sellos    # Ver estado"
echo "  sudo systemctl restart detector-sellos   # Reiniciar"
echo "  sudo systemctl logs detector-sellos      # Ver logs"
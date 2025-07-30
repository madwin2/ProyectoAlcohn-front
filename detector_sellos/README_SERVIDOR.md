# Detector de Sellos - Servidor Hetzner Ubuntu 24.04

## 🚀 Instalación

### 1. Conectar al servidor
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Copiar archivos
```bash
# Subir archivos al servidor (desde tu máquina local)
scp -r detector_sellos/* root@YOUR_SERVER_IP:/tmp/

# En el servidor, mover archivos
sudo mv /tmp/* /opt/detector-sellos/
```

### 3. Ejecutar setup automático
```bash
cd /opt/detector-sellos
chmod +x setup_ubuntu.sh
./setup_ubuntu.sh
```

## 🔧 Configuración Manual (alternativa)

Si prefieres instalar paso a paso:

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias
sudo apt install -y python3 python3-pip python3-venv git curl libcairo2-dev pkg-config python3-dev

# 3. Crear entorno virtual
cd /opt/detector-sellos
python3 -m venv venv
source venv/bin/activate

# 4. Instalar Python packages
pip install --upgrade pip
pip install -r requirements.txt

# 5. Probar manualmente
python app.py
```

## 🌐 Configuración Nginx (Opcional)

Para usar con dominio y SSL:

```bash
# Instalar Nginx
sudo apt install nginx

# Configurar proxy reverso
sudo nano /etc/nginx/sites-available/detector-sellos

# Contenido del archivo:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/detector-sellos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📱 Uso de la API

### Endpoints disponibles:
- `GET /` - Información general
- `GET /health` - Estado de la API
- `POST /predict` - Procesamiento de imágenes
- `GET /docs` - Documentación interactiva

### Ejemplo de uso:
```python
import requests

# Health check
response = requests.get("http://YOUR_SERVER_IP:8000/health")
print(response.json())

# Predict
files = {
    'svgs': open('logo.svg', 'rb'),
    'fotos': open('photo.jpg', 'rb')
}
response = requests.post("http://YOUR_SERVER_IP:8000/predict", files=files)
print(response.json())
```

## 🔧 Comandos útiles

```bash
# Ver estado del servicio
sudo systemctl status detector-sellos

# Reiniciar servicio
sudo systemctl restart detector-sellos

# Ver logs
sudo journalctl -u detector-sellos -f

# Parar servicio
sudo systemctl stop detector-sellos

# Iniciar servicio
sudo systemctl start detector-sellos
```

## 🔄 Actualizar la aplicación

```bash
# 1. Parar servicio
sudo systemctl stop detector-sellos

# 2. Actualizar código
cd /opt/detector-sellos
# Subir nuevos archivos...

# 3. Instalar nuevas dependencias (si hay)
source venv/bin/activate
pip install -r requirements.txt

# 4. Reiniciar servicio
sudo systemctl start detector-sellos
```

## ⚡ Configuración Frontend

Actualiza tu frontend para usar la nueva URL:

```javascript
// En config/api.js
production: {
  CLIP_API_URL: 'http://YOUR_SERVER_IP:8000',
  // o con dominio: 'https://your-domain.com'
}
```

## 🐛 Troubleshooting

### API no responde:
```bash
sudo systemctl status detector-sellos
sudo journalctl -u detector-sellos -f
```

### Error de permisos:
```bash
sudo chown -R $USER:$USER /opt/detector-sellos
```

### Puerto ocupado:
```bash
sudo lsof -i :8000
sudo systemctl restart detector-sellos
```
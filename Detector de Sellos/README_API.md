# Detector de Sellos - API

Esta API expone la funcionalidad de comparación de sellos usando FastAPI.

## Instalación local

1. Instala las dependencias:

```bash
pip install -r requirements.txt
```

2. Ejecuta la API localmente:

```bash
uvicorn api:app --reload
```

La API estará disponible en http://localhost:8000

- Endpoint de prueba: http://localhost:8000/health
- Endpoint de predicción: http://localhost:8000/predict (POST, multipart/form-data, campo `file`)

## Despliegue gratuito en Render

1. Crea una cuenta en https://render.com
2. Haz un nuevo servicio de tipo **Web Service**.
3. Conecta tu repositorio (o sube el código).
4. Configura:
   - **Start command:**
     ```
     uvicorn api:app --host 0.0.0.0 --port 10000
     ```
   - **Python version:** 3.9+ (en settings avanzados)
   - **Build command:**
     ```
     pip install -r requirements.txt
     ```
   - **Port:** 10000
5. Sube los directorios `vectores` y los archivos necesarios.
6. ¡Listo! Tu API estará online y lista para integrarse con tu otra página.

## Notas
- Si usas Railway.app, el proceso es similar.
- Puedes probar la API desde Swagger UI en `/docs`. 
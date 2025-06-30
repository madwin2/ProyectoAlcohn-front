import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// === CONFIGURACIÓN DE SUPABASE ===
// ¡IMPORTANTE! Reemplaza estos valores por los de tu proyecto
const SUPABASE_URL = "SUPABASE_URL";
const SUPABASE_KEY = "SUPABASE_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Componente autocontenible para gestión de archivos en Supabase Storage.
 * Incluye subida, previsualización, eliminación y conversión EPS→SVG.
 * Props:
 * - carpeta: string (carpeta en storage, ej: "base" o "vector")
 * - archivos: array de rutas (opcional, si quieres controlar desde fuera)
 * - onChange: (nuevoArray) => void (opcional, para notificar cambios)
 * - label: string (opcional)
 */
export default function Archivos({ carpeta = "base", archivos: archivosProp, onChange, label = "Archivos" }) {
  const [archivos, setArchivos] = useState(archivosProp || []);
  const [open, setOpen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  // Obtener URL pública
  const getPublicUrl = (path) => {
    return supabase.storage.from("archivos-ventas").getPublicUrl(path).data.publicUrl;
  };

  // Conversión EPS a SVG usando CloudConvert (opcional)
  async function convertirEpsASvg(archivo) {
    // ¡IMPORTANTE! Pega tu API Key de CloudConvert aquí si quieres usar esta función
    const cloudconvertApiKey = "TU_CLOUDCONVERT_API_KEY";
    if (!archivo.name.toLowerCase().endsWith(".eps")) return archivo;
    try {
      // Paso 1: Crear Job
      const res = await fetch("https://api.cloudconvert.com/v2/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudconvertApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tasks: {
            upload_file: { operation: "import/upload" },
            convert_file: { operation: "convert", input: "upload_file", input_format: "eps", output_format: "svg" },
            export_file: { operation: "export/url", input: "convert_file" }
          }
        })
      });
      const jobData = await res.json();
      const uploadTask = jobData.data.tasks.find(t => t.name === "upload_file");
      const uploadUrl = uploadTask.result.form.url;
      const uploadParams = uploadTask.result.form.parameters;
      // Paso 2: Subir archivo EPS
      const uploadForm = new FormData();
      for (const key in uploadParams) uploadForm.append(key, uploadParams[key]);
      uploadForm.append("file", archivo);
      await fetch(uploadUrl, { method: "POST", body: uploadForm });
      // Paso 3: Esperar job completo
      let svgUrl = null;
      for (let i = 0; i < 10; i++) {
        const jobCheck = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
          headers: { Authorization: `Bearer ${cloudconvertApiKey}` }
        });
        const jobCheckData = await jobCheck.json();
        const exportTask = jobCheckData.data.tasks.find(
          (t) => t.operation === "export/url" && t.status === "finished"
        );
        if (exportTask && exportTask.result?.files?.length) {
          svgUrl = exportTask.result.files[0].url;
          break;
        }
        await new Promise((res) => setTimeout(res, 1500));
      }
      if (!svgUrl) throw new Error("No se pudo obtener SVG generado");
      const svgBlob = await fetch(svgUrl).then(r => r.blob());
      return new File([svgBlob], archivo.name.replace(/\.eps$/i, ".svg"), { type: "image/svg+xml" });
    } catch (err) {
      alert("Error al convertir EPS a SVG. Sube el archivo en SVG si puedes.");
      return null;
    }
  }

  // Subir archivo a Supabase (con conversión EPS→SVG si aplica)
  const subirArchivo = async (file) => {
    setSubiendo(true);
    let archivoSubir = file;
    if (file.name.toLowerCase().endsWith(".eps")) {
      archivoSubir = await convertirEpsASvg(file);
      if (!archivoSubir) { setSubiendo(false); return; }
    }
    const nombreArchivo = `${Date.now()}-${archivoSubir.name}`;
    const { data, error } = await supabase.storage
      .from("archivos-ventas")
      .upload(`${carpeta}/${nombreArchivo}`, archivoSubir, {
        contentType: archivoSubir.type,
        cacheControl: "3600",
        upsert: false,
      });
    setSubiendo(false);
    if (error) {
      alert("Error subiendo archivo");
      return null;
    }
    const nuevoArray = [...archivos, data.path];
    setArchivos(nuevoArray);
    onChange && onChange(nuevoArray);
    return data.path;
  };

  // Eliminar archivo del array y opcionalmente del storage
  const eliminarArchivo = async (path) => {
    const nuevoArray = archivos.filter((p) => p !== path);
    setArchivos(nuevoArray);
    onChange && onChange(nuevoArray);
    // Si quieres borrar físicamente en storage, descomenta:
    // await supabase.storage.from("archivos-ventas").remove([path]);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await subirArchivo(file);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {archivos.map((path, index) => {
        const url = getPublicUrl(path);
        const fileName = path.split("/").pop();
        return (
          <div key={index} className="relative group flex flex-col items-center justify-center w-16 h-16">
            <img
              src={url}
              alt={fileName}
              className="w-16 h-16 object-contain border rounded cursor-pointer"
              onClick={() => setOpen(path)}
            />
            {/* Botones solo en hover */}
            <div className="absolute top-1 right-1 flex-col gap-1 hidden group-hover:flex z-10">
              <button
                onClick={() => eliminarArchivo(path)}
                className="bg-[#232427] text-white text-xs rounded-full px-3 py-1 shadow hover:bg-[#313236] transition"
              >
                Eliminar
              </button>
              <label className="bg-[#232427] text-white text-xs rounded-full px-3 py-1 shadow hover:bg-[#313236] transition cursor-pointer mt-1">
                Cambiar
                <input type="file" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
        );
      })}
      {/* Botón Sumar */}
      <label className="text-blue-600 underline text-xs cursor-pointer mt-2">
        {subiendo ? "Subiendo..." : "Sumar"}
        <input type="file" onChange={handleFileChange} className="hidden" disabled={subiendo} />
      </label>
      {/* Modal de previsualización */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white p-4 rounded shadow-lg max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getPublicUrl(open)}
              alt="Vista previa"
              className="max-w-full max-h-[70vh] object-contain"
            />
            <div className="text-right mt-2">
              <button
                onClick={() => setOpen(null)}
                className="px-4 py-1 bg-red-500 text-white rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
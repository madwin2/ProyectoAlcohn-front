-- VECTRIC LUA SCRIPT
-- Combina la automatización funcional con el copiado de objetos a la capa VECTOR
-- VERSIÓN PARA MÁQUINA G - Coordenadas modificadas

-- CAPTURAR FUNCIONES GLOBALES ANTES DE STRICT (para PASO 2)
local CreateCopyOfSelectedContours = CreateCopyOfSelectedContours
local GetDefaultContourTolerance = GetDefaultContourTolerance
local CreateCadGroup = CreateCadGroup

local VECTOR_FOLDER = "C:/Users/julia/Documents/CNC/Vectores/prueba"
local SUPPORTED_FORMATS = {"*.dxf", "*.dwg", "*.svg"}

function DisplayMessage(message)
    DisplayMessageBox(message)
    print(message)
end

function FileExists(filepath)
    local windows_path = filepath:gsub("/", "\\")
    local file = io.open(windows_path, "r")
    if file then
        file:close()
        return true
    end
    return false
end

function GetFilesInDirectory(directory_path, pattern)
    local files = {}
    
    if not directory_path or directory_path == "" then
        DisplayMessage("Error: Ruta de directorio vacía")
        return files
    end
    
    local windows_path = directory_path:gsub("/", "\\"):gsub("\\+$", "")
    
    local command = 'dir "' .. windows_path .. '\\' .. pattern .. '" /B 2>nul'
    local handle = io.popen(command)
    
    if handle then
        for line in handle:lines() do
            line = line:match("^%s*(.-)%s*$")
            if line and line ~= "" then
                local full_path = windows_path .. "\\" .. line
                if FileExists(full_path) then
                    table.insert(files, full_path)
                end
            end
        end
        handle:close()
    end
    
    return files
end

function ImportVectorFile(filepath)
    local job = VectricJob()
    if not job.Exists then
        DisplayMessage("Error: No hay trabajo activo")
        return false
    end
    
    local extension = filepath:match("%.(%w+)$")
    if extension then
        extension = extension:lower()
    else
        DisplayMessage("Error: No se pudo determinar extensión")
        return false
    end
    
    local success = false
    
    if extension == "dxf" or extension == "dwg" then
        local status, result = pcall(function()
            return job:ImportDxfDwg(filepath)
        end)
        
        if status and result then
            success = true
        else
            DisplayMessage("✗ Error importando DXF/DWG: " .. tostring(result))
        end
        
    elseif extension == "svg" then
        local status, result = pcall(function()
            return job:ImportSVG(filepath)
        end)
        
        if status and result then
            success = true
        else
            DisplayMessage("✗ Error importando SVG: " .. tostring(result))
        end
    end
    
    if success then
        job:Refresh2DView()
        
        -- Agrupar los vectores recién importados
        local selection = job.Selection
        if not selection.IsEmpty then
            job:GroupSelection()
        end
        
        return true
    else
        return false
    end
end

function CopySelectionToVectorLayer()
    local job = VectricJob()
    local selection = job.Selection
    
    if selection.IsEmpty then
        DisplayMessage("Advertencia: No hay objetos seleccionados para copiar")
        return false
    end
    
    local layer_manager = job.LayerManager
    local vector_layer = layer_manager:GetLayerWithName("VECTOR")
    
    -- Recolectar objetos seleccionados
    local objects_to_copy = {}
    local pos = selection:GetHeadPosition()
    while pos do
        local obj, newPos = selection:GetNext(pos)
        pos = newPos
        if obj then
            table.insert(objects_to_copy, obj)
        end
    end
    
    local copied_count = 0
    
    -- MÉTODO 1: Intentar Clone()
    for i, obj in ipairs(objects_to_copy) do
        local status, cloned_obj = pcall(function()
            return obj:Clone()
        end)
        
        if status and cloned_obj then
            local add_status, add_result = pcall(function()
                vector_layer:AddObject(cloned_obj, true)
                return true
            end)
            
            if add_status and add_result then
                copied_count = copied_count + 1
            end
        end
    end
    
    -- MÉTODO 2: Si Clone falla, intentar recrear desde contorno
    if copied_count == 0 then
        for i, obj in ipairs(objects_to_copy) do
            local status, contour = pcall(function()
                return obj:GetContour()
            end)
            
            if status and contour then
                local new_status, new_obj = pcall(function()
                    return CreateCadContour(contour)
                end)
                
                if new_status and new_obj then
                    local add_status, add_result = pcall(function()
                        vector_layer:AddObject(new_obj, true)
                        return true
                    end)
                    
                    if add_status and add_result then
                        copied_count = copied_count + 1
                    end
                end
            end
        end
    end
    
    job:Refresh2DView()
    
    if copied_count > 0 then
        -- Eliminar los objetos originales de sus capas originales
        local deleted_count = 0
        
        for i, obj in ipairs(objects_to_copy) do
            -- Buscar la capa que contiene este objeto
            local layer_manager = job.LayerManager
            local layer_pos = layer_manager:GetHeadPosition()
            
            while layer_pos do
                local layer, newLayerPos = layer_manager:GetNext(layer_pos)
                layer_pos = newLayerPos
                
                if layer then
                    -- Verificar si no es la capa VECTOR
                    local layer_name = ""
                    local name_status, name_result = pcall(function()
                        return layer.Name
                    end)
                    if name_status then
                        layer_name = name_result
                    end
                    
                    if layer_name ~= "VECTOR" then -- No eliminar de capa VECTOR
                    -- Buscar el objeto en esta capa
                    local obj_pos = layer:GetHeadPosition()
                    while obj_pos do
                        local layer_obj, newObjPos = layer:GetNext(obj_pos)
                        obj_pos = newObjPos
                        
                        -- Comparar por propiedades en lugar de referencia directa
                        if layer_obj and obj then
                            local obj_bbox = nil
                            local layer_obj_bbox = nil
                            
                            local obj_status, obj_result = pcall(function()
                                return obj:GetBoundingBox()
                            end)
                            if obj_status then obj_bbox = obj_result end
                            
                            local layer_obj_status, layer_obj_result = pcall(function()
                                return layer_obj:GetBoundingBox()
                            end)
                            if layer_obj_status then layer_obj_bbox = layer_obj_result end
                            
                            -- Si ambos objetos tienen bounding box similar, asumir que es el mismo
                            if obj_bbox and layer_obj_bbox and
                               math.abs(obj_bbox.MinX - layer_obj_bbox.MinX) < 0.001 and
                               math.abs(obj_bbox.MinY - layer_obj_bbox.MinY) < 0.001 and
                               math.abs(obj_bbox.MaxX - layer_obj_bbox.MaxX) < 0.001 and
                               math.abs(obj_bbox.MaxY - layer_obj_bbox.MaxY) < 0.001 then
                                
                                -- Eliminar el objeto de la capa
                                local remove_status, remove_result = pcall(function()
                                    return layer:RemoveObject(layer_obj)
                                end)
                                
                                if remove_status and remove_result then
                                    deleted_count = deleted_count + 1
                                end
                                break
                            end
                        end
                    end
                    end -- Cerrar if layer_name ~= "VECTOR"
                end -- Cerrar if layer
            end -- Cerrar while layer_pos
        end -- Cerrar for objects_to_copy
        
        -- Eliminar objetos originales silenciosamente
        
        job:Refresh2DView()
        return true
    else
        DisplayMessage("✗ No se pudo copiar ningún objeto a capa VECTOR")
        return false
    end
end

function GetVectorObjectsFromLayer(layer_name)
    local job = VectricJob()
    if not job.Exists then
        return {}
    end
    
    local layer_manager = job.LayerManager
    local layer = layer_manager:FindLayerWithName(layer_name)
    if not layer then
        DisplayMessage("Advertencia: No se encontró la capa '" .. layer_name .. "'")
        return {}
    end
    
    local objects = {}
    local pos = layer:GetHeadPosition()
    while pos do
        local obj, newPos = layer:GetNext(pos)
        pos = newPos
        if obj then
            table.insert(objects, obj)
        end
    end
    
    return objects
end

function ProcessSingleObject(obj)
    local job = VectricJob()
    local selection = job.Selection
    
    -- Seleccionar solo este objeto
    selection:Clear()
    selection:Add(obj, true, false)
    
    if selection.IsEmpty then
        DisplayMessage("Error: No se pudo seleccionar objeto")
        return false
    end
    
    -- Agrupar la selección
    if not job:GroupSelection() then
        DisplayMessage("Advertencia: No se pudo agrupar (puede que ya esté agrupado)")
    end
    
    -- Espejar el objeto
    local bbox = selection:GetBoundingBox()
    if not bbox then
        DisplayMessage("Error: No se pudo obtener bounding box")
        return false
    end
    
    local centerX = (bbox.MinX + bbox.MaxX) / 2
    local refP1 = Point2D(centerX, 0)
    local refP2 = Point2D(centerX, 1)
    local mirrorMatrix = ReflectionMatrix2D(refP1, refP2)
    
    local pos = selection:GetHeadPosition()
    while pos do
        local cadObj, newPos = selection:GetNext(pos)
        pos = newPos
        if cadObj and cadObj.IsSelected and cadObj:CanTransform(4) then
            cadObj:Transform(mirrorMatrix)
        end
    end
    
    job:Refresh2DView()
    
    -- POSICIONAMIENTO EN COLUMNAS PARA MÁQUINA G
    local columns = {
        { nom = 38,   eff = 37,   xpos = 50.65 },  -- Columna de 38mm en X = 50.65
        { nom = 12.7, eff = 11.7, xpos = 94.4 }    -- Columna de 12mm en X = 94.4
    }
    
    bbox = selection:GetBoundingBox()
    if not bbox then
        DisplayMessage("Error: No se pudo recalcular bounding box")
        return false
    end
    
    local groupWidth = bbox.MaxX - bbox.MinX
    local groupHeight = bbox.MaxY - bbox.MinY
    
    -- Determinar columna más adecuada
    local candidate = nil
    local needRotation = false
    
    for i, col in ipairs(columns) do
        if groupWidth <= col.eff then
            if candidate == nil or col.eff < candidate.eff then
                candidate = col
                needRotation = false
            end
        elseif groupHeight <= col.eff then
            if candidate == nil or col.eff < candidate.eff then
                candidate = col
                needRotation = true
            end
        end
    end
    
    if not candidate then
        DisplayMessage("Advertencia: El objeto no cabe en ninguna columna estándar")
        candidate = columns[4] -- Usar la columna más grande
        needRotation = false
    end
    
    -- Rotar si es necesario
    if needRotation then
        local groupCenterX = (bbox.MinX + bbox.MaxX) / 2
        local groupCenterY = (bbox.MinY + bbox.MaxY) / 2
        local rotationMatrix = RotationMatrix2D(Point2D(groupCenterX, groupCenterY), 90)
        
        selection:Transform(rotationMatrix)
        job:Refresh2DView()
        
        bbox = selection:GetBoundingBox()
        if not bbox then
            DisplayMessage("Error: No se pudo recalcular bbox después de rotación")
            return false
        end
    end
    
    -- Determinar posición Y evitando superposiciones
    local targetTopY = -9.788
    local tol = 1.0  -- tolerancia en mm para identificar objetos en la misma columna
    local layer_manager = job.LayerManager
    local corteLayer = layer_manager:GetLayerWithName("Corte")
    
    if corteLayer then
        local pos2 = corteLayer:GetHeadPosition()
        while pos2 do
            local obj, newPos2 = corteLayer:GetNext(pos2)
            pos2 = newPos2
            if obj then
                local objBBox = obj:GetBoundingBox()
                if objBBox then
                    local objCenterX = (objBBox.MinX + objBBox.MaxX) / 2
                    if math.abs(objCenterX - candidate.xpos) < tol then
                        if objBBox.MinY < targetTopY then
                            targetTopY = objBBox.MinY - 4   -- 4 mm de separación
                        end
                    end
                end
            end
        end
    end
    
    -- Posicionar en columna
    local groupCenterX = (bbox.MinX + bbox.MaxX) / 2
    local dx = candidate.xpos - groupCenterX
    local dy = targetTopY - bbox.MaxY
    
    local translationMatrix = TranslationMatrix2D(Vector2D(dx, dy))
    selection:Transform(translationMatrix)
    job:Refresh2DView()
    
    -- Obtener el bbox actualizado después del posicionamiento
    local updated_bbox = selection:GetBoundingBox()
    if updated_bbox then
        -- Crear elementos adicionales (línea y círculo)
        CreateAdditionalElements(candidate, updated_bbox)
    else
        DisplayMessage("Error: No se pudo obtener bbox actualizado para elementos adicionales")
    end
    
    return true
end


function CopySelectionToLayer(job, selection, target_layer)
    if not job or not selection or not target_layer then
        return false
    end
    
    if selection.IsEmpty then
        return false
    end
    
    local copied_count = 0
    local pos = selection:GetHeadPosition()
    
    while pos do
        local obj, newPos = selection:GetNext(pos)
        pos = newPos
        
        if obj then
            local status, cloned_obj = pcall(function()
                return obj:Clone()
            end)
            
            if status and cloned_obj then
                local add_status, add_result = pcall(function()
                    target_layer:AddObject(cloned_obj, true)
                    return true
                end)
                
                if add_status and add_result then
                    copied_count = copied_count + 1
                end
            end
        end
    end
    
    return copied_count > 0
end

function CreateSimpleOffsetContour(original_contour, offset_distance)
    -- Validar entrada
    if not original_contour or not offset_distance then
        DisplayMessage("Error: Parámetros inválidos para CreateSimpleOffsetContour")
        return nil
    end
    
    -- Crear un nuevo contorno para el offset
    local offset_contour = Contour(0.0)
    
    -- Obtener bounding box del contorno original
    local bbox_status, bbox = pcall(function()
        return original_contour:GetBoundingBox()
    end)
    
    if not bbox_status or not bbox then
        DisplayMessage("Error: No se pudo obtener bounding box del contorno")
        return nil
    end
    
    local center_x = (bbox.MinX + bbox.MaxX) / 2
    local center_y = (bbox.MinY + bbox.MaxY) / 2
    
    -- Iterar sobre los spans del contorno original
    local pos_status, pos = pcall(function()
        return original_contour:GetHeadPosition()
    end)
    
    if not pos_status or not pos then
        DisplayMessage("Error: No se pudo obtener posición inicial del contorno")
        return nil
    end
    
    local points = {}
    
    while pos do
        local span_status, span, newPos = pcall(function()
            return original_contour:GetNext(pos)
        end)
        
        if span_status and span and span.StartPoint2D then
            table.insert(points, span.StartPoint2D)
        end
        
        pos = newPos
    end
    
    -- Si el contorno está abierto, agregar el punto final
    if original_contour.IsOpen and original_contour.EndPoint2D then
        table.insert(points, original_contour.EndPoint2D)
    end
    
    if #points == 0 then
        DisplayMessage("Error: No se encontraron puntos en el contorno")
        return nil
    end
    
    -- Crear puntos con offset simple (moviendo radialmente desde el centro)
    local offset_points = {}
    for i, point in ipairs(points) do
        local dx = point.X - center_x
        local dy = point.Y - center_y
        local distance = math.sqrt(dx*dx + dy*dy)
        
        if distance > 0 then
            local unit_x = dx / distance
            local unit_y = dy / distance
            
            local new_x = point.X + unit_x * offset_distance
            local new_y = point.Y + unit_y * offset_distance
            
            table.insert(offset_points, Point2D(new_x, new_y))
        else
            table.insert(offset_points, point)
        end
    end
    
    -- Construir el nuevo contorno
    if #offset_points > 0 then
        offset_contour:AppendPoint(offset_points[1])
        
        for i = 2, #offset_points do
            offset_contour:LineTo(offset_points[i])
        end
        
        -- Cerrar el contorno si no está abierto
        if not original_contour.IsOpen then
            offset_contour:LineTo(offset_points[1])
        end
    end
    
    return offset_contour
end

function ProcessStep2OffsetOperations()
    local job = VectricJob()
    if not job.Exists then
        DisplayMessage("Error: No hay trabajo activo")
        return false
    end

    -- Seleccionar todos los vectores de la capa VECTOR
    local vector_layer = job.LayerManager:GetLayerWithName("VECTOR")
    if not vector_layer then
        DisplayMessage("Error: No se encontró la capa VECTOR")
        return false
    end

    job.Selection:Clear()
    local pos = vector_layer:GetHeadPosition()
    local selected_count = 0
    
    while pos ~= nil do
        local object
        object, pos = vector_layer:GetNext(pos)
        job.Selection:Add(object, true, false)
        selected_count = selected_count + 1
    end

    if job.Selection.IsEmpty then
        DisplayMessage("Error: No hay vectores seleccionados")
        return false
    end

    -- Finalizar selección
    if job.Selection.GroupSelectionFinished then
        pcall(function() job.Selection:GroupSelectionFinished() end)
    end

    -- Obtener tolerancia
    local tolerance = 0.01
    if GetDefaultContourTolerance then
        local tol_success = pcall(function()
            tolerance = GetDefaultContourTolerance()
        end)
    end

    -- Proceso principal de offset
    local success = pcall(function()
        -- 1. Crear copia de contornos seleccionados
        local group = CreateCopyOfSelectedContours(false, false, tolerance)
        
        if not group then
            error("CreateCopyOfSelectedContours devolvió nil")
        end

        -- 2. Crear offset exterior de 4mm
        local offset_4mm = group:Offset(4.0, 4.0, 1, true)
        
        if not offset_4mm then
            error("Offset de 4mm falló")
        end

        -- 3. Crear offset interior de 3.5mm sobre el resultado anterior
        local offset_3_5mm = offset_4mm:Offset(-3.5, 3.5, 1, true)
        
        if not offset_3_5mm then
            error("Offset interior de 3.5mm falló")
        end

        -- 4. Agregar offset de 3.5mm a capa "Offset 1 vector"
        local cad_group_1 = CreateCadGroup(offset_3_5mm)
        local offset1_layer = job.LayerManager:GetLayerWithName("Offset 1 vector")
        offset1_layer:AddObject(cad_group_1, true)

        -- 5. Crear offset exterior de 1.5mm sobre el resultado de 3.5mm
        local offset_1_5mm = offset_3_5mm:Offset(1.5, 1.5, 1, true)
        
        if not offset_1_5mm then
            error("Offset exterior de 1.5mm falló")
        end

        -- 6. Agregar offset de 1.5mm a capa "Offset exterior vector"
        local cad_group_2 = CreateCadGroup(offset_1_5mm)
        local offset_ext_layer = job.LayerManager:GetLayerWithName("Offset exterior vector")
        offset_ext_layer:AddObject(cad_group_2, true)

        -- 7. Actualizar vista
        job:Refresh2DView()
        
        return true
    end)

    if not success then
        DisplayMessage("ERROR: El proceso de offset falló")
        return false
    end

    return true
end

function ProcessStep3RectangleOperations()
    local job = VectricJob()
    if not job.Exists then
        DisplayMessage("Error: No hay trabajo activo")
        return false
    end

    local layer_manager = job.LayerManager
    
    -- Verificar que existe la capa "Corte" (donde busca vectores el PASO 3)
    local corteLayer = layer_manager:GetLayerWithName("Corte")
    if not corteLayer then
        corteLayer = layer_manager:GetLayerWithName("Corte") -- Esto la crea automáticamente
    end

    -- Verificar/crear capas de destino
    local planeadoLayer = layer_manager:GetLayerWithName("Planeado")
    if not planeadoLayer then
        planeadoLayer = layer_manager:GetLayerWithName("Planeado")
    end

    local rectExtLayer = layer_manager:GetLayerWithName("Rectangulo exterior")
    if not rectExtLayer then
        rectExtLayer = layer_manager:GetLayerWithName("Rectangulo exterior")
    end

    -- Tolerancia para comparar posiciones X
    local tol = 1.0

    -- DEFINICIÓN DE COLUMNAS PARA MÁQUINA G
    local columns = {
        { nom = 38,   xpos = 50.65 },   -- Columna de 38mm en X = 50.65
        { nom = 12.7, xpos = 94.4 }     -- Columna de 12mm en X = 94.4
    }

    local rectangles_created = 0

    -- Procesar cada columna
    for i, col in ipairs(columns) do
        local minY = nil  -- Almacenará el borde inferior (mínimo Y) de los vectores en la columna
        local vectors_found = 0
        
        -- Buscar vectores en esta columna en la capa "Corte"
        local pos = corteLayer:GetHeadPosition()
        while pos do
            local obj, newPos = corteLayer:GetNext(pos)
            pos = newPos
            if obj then
                local bb = obj:GetBoundingBox()
                if bb then
                    local cx = (bb.MinX + bb.MaxX) / 2
                    if math.abs(cx - col.xpos) < tol then
                        vectors_found = vectors_found + 1
                        if (minY == nil) or (bb.MinY < minY) then
                            minY = bb.MinY
                        end
                    end
                end
            end
        end

        if minY then
            -- Coordenadas verticales: top = 0; bottom = minY - 3 (3 mm por debajo del vector más bajo)
            local topY = 0
            local bottomY = minY - 3

            -- Crear Rectángulo 1: ancho = (nominal + 6) mm, centrado en col.xpos
            local width1 = col.nom + 6
            local halfWidth1 = width1 / 2
            local leftX1 = col.xpos - halfWidth1
            local rightX1 = col.xpos + halfWidth1

            local rectContour1 = Contour(0.0)
            rectContour1:AppendPoint(Point2D(leftX1, topY))
            rectContour1:LineTo(Point2D(rightX1, topY))
            rectContour1:LineTo(Point2D(rightX1, bottomY))
            rectContour1:LineTo(Point2D(leftX1, bottomY))
            rectContour1:LineTo(Point2D(leftX1, topY))

            local cadRect1 = CreateCadContour(rectContour1)
            if cadRect1 then
                planeadoLayer:AddObject(cadRect1, true)
                rectangles_created = rectangles_created + 1
            end

            -- Crear Rectángulo 2: ancho = (nominal + 14) mm, centrado en col.xpos
            local width2 = col.nom + 14
            local halfWidth2 = width2 / 2
            local leftX2 = col.xpos - halfWidth2
            local rightX2 = col.xpos + halfWidth2

            local rectContour2 = Contour(0.0)
            rectContour2:AppendPoint(Point2D(leftX2, topY))
            rectContour2:LineTo(Point2D(rightX2, topY))
            rectContour2:LineTo(Point2D(rightX2, bottomY))
            rectContour2:LineTo(Point2D(leftX2, bottomY))
            rectContour2:LineTo(Point2D(leftX2, topY))

            local cadRect2 = CreateCadContour(rectContour2)
            if cadRect2 then
                rectExtLayer:AddObject(cadRect2, true)
                rectangles_created = rectangles_created + 1
            end
        end
    end

    job:Refresh2DView()
    
    return true
end

function UngroupAllVectors()
    local job = VectricJob()
    if not job.Exists then
        DisplayMessage("Error: No hay trabajo activo")
        return false
    end

    local layers_to_process = {
        "VECTOR",
        "Offset 1 vector", 
        "Offset exterior vector"
    }

    local total_ungrouped = 0

    for _, layer_name in ipairs(layers_to_process) do
        local layer = job.LayerManager:GetLayerWithName(layer_name)
        if layer then
            -- Seleccionar todos los objetos de esta capa
            job.Selection:Clear()
            local pos = layer:GetHeadPosition()
            local layer_selected = 0
            
            while pos do
                local obj, newPos = layer:GetNext(pos)
                pos = newPos
                if obj then
                    job.Selection:Add(obj, true, false)
                    layer_selected = layer_selected + 1
                end
            end
            
            if layer_selected > 0 then
                -- Finalizar selección
                if job.Selection.GroupSelectionFinished then
                    pcall(function() job.Selection:GroupSelectionFinished() end)
                end
                
                -- Probar el nuevo método UnGroupSelection con parámetros
                local ungroup_success = pcall(function()
                    if job.UnGroupSelection then
                        local success, err = job:UnGroupSelection(true, false)
                        if success then
                            total_ungrouped = total_ungrouped + layer_selected
                            return true
                        else
                            error("UnGroupSelection devolvió false: " .. tostring(err))
                        end
                    else
                        error("UnGroupSelection no disponible")
                    end
                end)
                
                if not ungroup_success then
                    DisplayMessage("⚠ No se pudo desagrupar en " .. layer_name)
                end
            end
        end
    end

    job.Selection:Clear()
    job:Refresh2DView()
    
    if total_ungrouped > 0 then
        return true
    else
        DisplayMessage("⚠ No se pudieron desagrupar objetos automáticamente")
        DisplayMessage("→ Desagrupa manualmente con Ctrl+Shift+G si es necesario")
        return true -- No fallar por esto
    end
end

function ProcessStep4RecalculateToolpaths()
    local job = VectricJob()
    if not job.Exists then
        DisplayMessage("Error: No hay trabajo activo")
        return false
    end

    local success = pcall(function()
        local tp = ToolpathManager()
        
        if not tp then
            error("No se pudo crear ToolpathManager")
        end
        
        local toolpath_count = tp.Count
        
        if toolpath_count == 0 then
            return true
        end
        
        -- Usar el método que funciona según ChatGPT
        if tp.RecalculateAllToolpaths then
            tp:RecalculateAllToolpaths()
            job:Refresh2DView()
            return true
        else
            error("RecalculateAllToolpaths no disponible")
        end
    end)

    if success then
        return true
    else
        DisplayMessage("Error recalculando trayectorias")
        DisplayMessage("→ Recalcula manualmente las trayectorias desde menú Toolpaths")
        return false
    end
end

function CreateAdditionalElements(column, bbox)
    -- Validar parámetros
    if not column or not bbox then
        DisplayMessage("Error: CreateAdditionalElements - parámetros inválidos")
        return
    end
    
    local job = VectricJob()
    local layer_manager = job.LayerManager
    
    -- Crear capas si no existen
    local corteLayer = layer_manager:GetLayerWithName("Corte")
    local taladradoLayer = layer_manager:GetLayerWithName("Taladrado")
    
    -- Validar que bbox tiene valores válidos
    if not bbox.MinX or not bbox.MaxX or not bbox.MinY or not bbox.MaxY then
        DisplayMessage("Error: CreateAdditionalElements - bbox inválido")
        return
    end
    
    -- Línea horizontal
    local lineLength = column.nom + 8
    local halfLine = lineLength / 2
    local lineX1 = column.xpos - halfLine
    local lineX2 = column.xpos + halfLine
    local lineY = bbox.MinY - 4
    
    -- Validar que los valores son números válidos
    if not lineX1 or not lineX2 or not lineY or 
       lineX1 ~= lineX1 or lineX2 ~= lineX2 or lineY ~= lineY then -- NaN check
        DisplayMessage("Error: CreateAdditionalElements - valores de línea inválidos")
        return
    end
    
    local success, err = pcall(function()
        local newLineContour = Contour(0.0)
        newLineContour:AppendPoint(Point2D(lineX1, lineY))
        newLineContour:LineTo(Point2D(lineX2, lineY))
        
        local cad_line = CreateCadContour(newLineContour)
        if cad_line then
            corteLayer:AddObject(cad_line, true)
        end
    end)
    
    if not success then
        DisplayMessage("Error creando línea: " .. tostring(err))
        return
    end
    
    -- Círculo de taladrado
    local radius = 3
    local circleCenterX = (bbox.MinX + bbox.MaxX) / 2
    local circleCenterY = (bbox.MinY + bbox.MaxY) / 2
    
    -- Validar que los valores del círculo son válidos
    if not circleCenterX or not circleCenterY or 
       circleCenterX ~= circleCenterX or circleCenterY ~= circleCenterY then -- NaN check
        DisplayMessage("Error: CreateAdditionalElements - valores de círculo inválidos")
        return
    end
    
    local circle_success, circle_err = pcall(function()
        local circleContour = Contour(0.0)
        circleContour:AppendPoint(Point2D(circleCenterX + radius, circleCenterY))
        circleContour:ArcTo(Point2D(circleCenterX, circleCenterY + radius), Point2D(circleCenterX, circleCenterY), true)
        circleContour:ArcTo(Point2D(circleCenterX - radius, circleCenterY), Point2D(circleCenterX, circleCenterY), true)
        circleContour:ArcTo(Point2D(circleCenterX, circleCenterY - radius), Point2D(circleCenterX, circleCenterY), true)
        circleContour:ArcTo(Point2D(circleCenterX + radius, circleCenterY), Point2D(circleCenterX, circleCenterY), true)
        
        local cad_circle = CreateCadContour(circleContour)
        if cad_circle then
            taladradoLayer:AddObject(cad_circle, true)
        end
    end)
    
    if not circle_success then
        DisplayMessage("Error creando círculo: " .. tostring(circle_err))
        return
    end
    
    job:Refresh2DView()
end

function main()
    local job = VectricJob()
    if not job.Exists then
        DisplayMessage("Error: No hay trabajo activo")
        return false
    end
    
    -- Buscar archivos vectoriales
    local all_files = {}
    for _, format in ipairs(SUPPORTED_FORMATS) do
        local files = GetFilesInDirectory(VECTOR_FOLDER, format)
        for _, file in ipairs(files) do
            table.insert(all_files, file)
        end
    end
    
    if #all_files == 0 then
        DisplayMessage("No se encontraron archivos vectoriales")
        return false
    end
    
    -- Procesar cada archivo
    local total_processed = 0
    
    for i, filepath in ipairs(all_files) do
        -- Importar archivo
        if ImportVectorFile(filepath) then
            -- Copiar objetos importados a capa VECTOR
            if CopySelectionToVectorLayer() then
                -- Ahora procesar desde la capa VECTOR
                local vector_objects = GetVectorObjectsFromLayer("VECTOR")
                if #vector_objects > 0 then
                    -- Encontrar el último objeto agregado (el grupo recién copiado)
                    local latest_obj = vector_objects[#vector_objects]
                    if latest_obj then
                        if ProcessSingleObject(latest_obj) then
                            total_processed = total_processed + 1
                        end
                    end
                end
            else
                -- Fallback: procesar directamente los objetos seleccionados
                local selection = job.Selection
                if not selection.IsEmpty then
                    local processed_count = 0
                    local pos = selection:GetHeadPosition()
                    while pos do
                        local obj, newPos = selection:GetNext(pos)
                        pos = newPos
                        if obj then
                            if ProcessSingleObject(obj) then
                                processed_count = processed_count + 1
                            end
                        end
                    end
                    
                    if processed_count > 0 then
                        total_processed = total_processed + 1
                    end
                end
            end
        end
    end
    
    if total_processed > 0 then
        -- Ejecutar Paso 2: Operaciones de Offset
        if ProcessStep2OffsetOperations() then
            -- Ejecutar Paso 3: Crear Rectángulos
            if ProcessStep3RectangleOperations() then
                -- Desagrupar todos los vectores
                if UngroupAllVectors() then
                    -- Ejecutar Paso 4: Recalcular Trayectorias
                    if ProcessStep4RecalculateToolpaths() then
                        DisplayMessage("🎉 ¡Automatización completa exitosa!")
                        DisplayMessage("✅ Todos los pasos completados correctamente")
                        DisplayMessage("🏭 MÁQUINA G - Coordenadas optimizadas")
                        return true
                    else
                        DisplayMessage("❌ Error recalculando trayectorias")
                        DisplayMessage("✓ Pasos 1, 2, 3 y desagrupado completados")
                        return true -- No fallar por recalculado de trayectorias
                    end
                else
                    -- Continuar con Paso 4 aunque falle el desagrupado
                    if ProcessStep4RecalculateToolpaths() then
                        DisplayMessage("🎉 ¡Automatización completa exitosa!")
                        DisplayMessage("✅ Todos los pasos completados (con advertencias en desagrupado)")
                        DisplayMessage("🏭 MÁQUINA G - Coordenadas optimizadas")
                        return true
                    else
                        DisplayMessage("❌ Error recalculando trayectorias")
                        DisplayMessage("✓ Pasos 1, 2 y 3 completados")
                        return true
                    end
                end
            else
                DisplayMessage("❌ Error en Paso 3")
                return false
            end
        else
            DisplayMessage("❌ Error en Paso 2")
            return false
        end
    else
        DisplayMessage("❌ No se procesó ningún archivo")
        return false
    end
end

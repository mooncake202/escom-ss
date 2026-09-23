# Catálogo de estados del sistema

Todos los valores en minúsculas; palabras compuestas separadas con guion bajo (snake_case).

---

## Módulo: Gestión de Ofertas


### CU-PRO-01 / CU-PRO-02 / CU-PRO-04 — `oferta_servicio.estado_oferta`
⚠️  

- `pendiente_revision`
- `aprobada`
- `rechazada`
- `concluida`
- `cerrada`



## Módulo: Gestión Reportes

Entidad: reporte_mensual
Campo: estado_reporte
Estados:
- pendiente_revision_profesor
- rechazado_profesor
- pendiente_revision_coordinador
- rechazado_coordinador
- aprobado_coordinador


Entidad: reporte_global
Campo: estado_reporte
Estados:
- pendiente_revision_profesor
- rechazado_profesor
- pendiente_revision_coordinador
- rechazado_coordinador
- aprobado_coordinador


Entidad: revision_reporte_mensual
Campo: estado
Estados:
- aprobado
- rechazado


Entidad: revision_reporte_global
Campo: estado
Estados:
- aprobado
- rechazado


Entidad: documento
Campo: estado_documento
Estados/valores utilizados:
- vigente

Nota:
"vigente" indica que es el documento actual asociado al reporte.
No significa que el reporte haya sido aprobado.


TIPOS DE REVISOR

Aplica a:
- revision_reporte_mensual
- revision_reporte_global

Valores:
- alumno
- profesor
- coordinador

## Módulo: Gestión Administrativa
Solicitudes de modificación de característica
solicitud_caracteristica:
- pendiente: En espera de revisión por Coordinación.
- aprobada: Solicitud aprobada y cambio aplicado.
- rechazada: Solicitud rechazada sin aplicar cambios.

Transiciones:
pendiente → aprobada | rechazada

### CU-ADM-09 / CU-ADM-11 / CU-ADM-12 — `solicitud_baja.estado`
- pendiente. (La solicitud todavía no tiene una resolución definitiva.)
- aprobada  (La baja fue autorizada. Inmediatamente después se ejecuta el borrado completo del proceso.)
- rechazada     (La baja no fue autorizada. La solicitud permanece almacenada y el alumno continúa su servicio.)

Transiciones: pendiente → aprobada | rechazada.

### `documento.estado_documento` para tipo_documento = 'expediente_baja'
- en_revision   (al enviarse; se mantiene durante la gestión institucional)
- aprobada  (la resolución fue favorable. Despues se ejecuta el borrado)
- rechazada     (si Coordinación rechaza la baja)
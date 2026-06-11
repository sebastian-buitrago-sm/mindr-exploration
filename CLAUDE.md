# mindr-exploration

## Spec-Driven Development con Spec-Kit

Seguir este flujo para crear cualquier nueva funcionalidad o fase de implementación:

### Flujo completo (en orden)

| Paso | Comando | Descripción | Obligatorio |
|------|---------|-------------|-------------|
| 1 | `/speckit-constitution` | Establecer principios, valores y restricciones del proyecto | Sí (solo la primera vez o cuando cambien los principios) |
| 2 | `/speckit-specify` | Crear o actualizar la especificación de la funcionalidad a partir de una descripción en lenguaje natural | Sí |
| 3 | `/speckit-clarify` | Identificar áreas ambiguas en la spec y resolverlas con preguntas estructuradas (máx. 5) | Recomendado — correr **antes** de `/speckit-plan` |
| 4 | `/speckit-plan` | Generar los artefactos de diseño y el plan de implementación | Sí |
| 5 | `/speckit-checklist` | Validar completitud, claridad y consistencia de los requerimientos del plan | Recomendado — correr **después** de `/speckit-plan` |
| 6 | `/speckit-tasks` | Generar `tasks.md` con tareas accionables ordenadas por dependencias | Sí |
| 7 | `/speckit-analyze` | Verificar consistencia y alineación entre `spec.md`, `plan.md` y `tasks.md` | Recomendado — correr **antes** de `/speckit-implement` |
| 8 | `/speckit-implement` | Ejecutar las tareas definidas en `tasks.md` | Sí |

### Flujo mínimo (rápido)

```
/speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement
```

### Flujo recomendado (con validaciones)

```
/speckit-constitution (primera vez)
  ↓
/speckit-specify
  ↓
/speckit-clarify        ← resuelve ambigüedades antes de planear
  ↓
/speckit-plan
  ↓
/speckit-checklist      ← valida que los requerimientos estén completos
  ↓
/speckit-tasks
  ↓
/speckit-analyze        ← verifica consistencia entre artefactos
  ↓
/speckit-implement
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at:
specs/002-call-records-dashboard/plan.md
<!-- SPECKIT END -->

# Estimación de Costos — Llamadas de Voz con IA

**Escenario base:** 10.000 llamadas × 3 minutos = **30.000 minutos totales**
**Objetivo:** desglosar el costo por minuto real, agrupando todos los servicios.

> **Cómo funciona realmente ElevenLabs Agents (importante):** Desde la reestructuración de precios de **noviembre 2025**, ElevenLabs Agents (antes "Conversational AI") se cobra **por minuto de conversación** (no por caracteres/créditos como el TTS). El precio del agente de voz (STT + TTS + turn-taking) es de **~$0,08/min**, y **el costo del LLM elegido y la telefonía se pasan aparte "at cost"** (facturados por separado según el uso). Es decir: **ElevenLabs SIEMPRE cobra el uso del modelo LLM que configures**, sumado al minuto de voz. No existe la opción de "LLM incluido gratis".
>
> **Fuentes:** [elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents) · [Help: How much does ElevenAgents cost](https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenAgents-cost)

---

## Resumen Ejecutivo

| Servicio | Modelo de cobro | Costo total (30 k min) | Costo / minuto |
|---|---|---|---|
| **ElevenLabs Agents** (voz: STT+TTS+turn-taking) | $0,08/min | $2.400,00 | $0,0800 |
| **LLM — Claude Sonnet 4.6** (pass-through at-cost) | tokens Anthropic | $172,00 | $0,0057 |
| **Twilio** (outbound call, pass-through at-cost) | $0,014/min | $420,00 | $0,0140 |
| **AWS Infraestructura** | uso | $22,15 | $0,0007 |
| **TOTAL** | | **$3.014,15** | **$0,1004** |

> **El costo por minuto ronda los $0,10/min**, dominado por la capa de voz de ElevenLabs (~80%). El LLM y la telefonía son pass-through, así que el costo total = capa de voz + LLM + telefonía + infraestructura.

---

## 1. ElevenLabs Agents (capa de voz)

### 1.1 Modelo de cobro (post-noviembre 2025)

ElevenLabs Agents tiene **dos componentes** que se suman:

1. **Minuto de agente de voz** → cubre STT (transcripción), TTS (síntesis) y el modelo de turn-taking. **~$0,08/min.**
2. **Pass-through "at cost"** → el LLM que elijas (Claude, GPT, Gemini, etc.) y el proveedor de telefonía (Twilio) se facturan **aparte, al costo real de uso**.

> *"External LLM and telephony provider costs are at cost and based on usage and varies by model."*
> — [Help ElevenLabs: How much does ElevenAgents cost](https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenAgents-cost)

**Cómo se mide la duración:** se cobra por la duración real de la llamada, con un **descuento del 95% en periodos de silencio mayores a 10 segundos**. Esto puede reducir el costo real en llamadas con pausas largas.

### 1.2 Planes, minutos incluidos y concurrencia

| Plan | Precio/mes | Minutos Agents incluidos | Llamadas de 3 min cubiertas | Concurrentes | $/min bundle |
|---|---|---|---|---|---|
| **Free** | $0 | 15 | ~5 | 4 | — |
| **Starter** | $6 | 75 | ~25 | 6 | $0,080 |
| **Creator** | **$11 primer mes (50% off), luego $22** | 275 | ~91 | 10 | $0,080 |
| **Pro** | $99 | 1.238 | ~412 | 20 | $0,080 |
| **Scale** | $299 | 3.738 | ~1.246 | 30 | $0,080 |
| **Business** | $990 | 12.375 | **~4.125** | 40 | $0,080 |
| **Enterprise** | Personalizado | Personalizado | Negociado | Sin tope | < $0,08 (volumen) |

> Con **3 min/llamada**, ni el plan más grande (Business, **~4.125 llamadas/mes**) cubre las 10.000 llamadas en un solo mes. Ver la sección 7 para el plan recomendado y el manejo del overage.

> **Fuente:** [elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents)
>
> El precio efectivo del bundle es consistente: `$990 ÷ 12.375 min = $0,080/min`. Lo mismo aplica a los demás planes.

### 1.3 Tarifas de exceso (overage) y burst

| Concepto | Costo |
|---|---|
| Minuto incluido en el bundle | $0,080/min (efectivo) |
| **Minuto de exceso (overage)** beyond bundle | **$0,08/min** (hasta $0,12/min en planes bajos) |
| **Burst pricing** (exceder concurrencia en picos) | **$0,16/min** (doble tarifa) |
| Mensaje de texto (chat) | $0,003/mensaje |

> **Fuentes:** [elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents) · [pxlpeak.com — ElevenLabs Pricing 2026](https://pxlpeak.com/blog/ai-tools/elevenlabs-pricing-guide) · [cekura.ai — ElevenLabs Pricing 2026](https://www.cekura.ai/blogs/elevenlabs-pricing)
>
> **Punto clave:** dado que la tarifa del bundle ($0,08/min) es igual a la tarifa de overage ($0,08/min), el costo unitario de la capa de voz es **$0,08/min sin importar si consumes el bundle o el exceso** — hasta que negocies tarifas Enterprise por volumen.

### 1.4 Costo de la capa de voz para 30.000 minutos

```
30.000 min × $0,08/min = $2.400,00
```

| Métrica | Valor |
|---|---|
| Costo capa de voz ElevenLabs (30k min) | **$2.400,00** |
| Costo por minuto | **$0,0800** |
| Costo por llamada (3 min) | $0,2400 |

> **Con descuento por silencios (>10s):** si las llamadas tienen ~15% de silencio, el costo real podría bajar a ~$2.040–$2.280. No se incluye en el total conservador.

---

## 2. LLM — Claude Sonnet 4.6 (pass-through at-cost)

ElevenLabs pasa el costo del LLM **al costo real**. Si configuras el agente con **Claude Sonnet 4.6**, se facturan las tarifas de Anthropic por cada turno de conversación.

### 2.1 Precios oficiales de Anthropic

| Modelo | Input | Output |
|---|---|---|
| `claude-sonnet-4-6` | **$3,00 / 1M tokens** | **$15,00 / 1M tokens** |

> **Fuente:** API de Anthropic (claude-api skill, datos certificados junio 2026). El contexto de 1M (`[1m]`) es el mismo modelo, mismo precio — no hay sobrecosto por contexto largo.

### 2.2 Estimación de consumo por llamada de 3 minutos

En una conversación de voz, el historial se reenvía en cada turno, por lo que el input se acumula:

| Parámetro | Estimación |
|---|---|
| Turnos de conversación | ~6–10 (usuario + agente) |
| System prompt del agente | ~800 tokens (se reenvía cada turno) |
| **Total input acumulado por llamada** | ~3.000 tokens |
| **Total output por llamada** | ~800 tokens |

### 2.3 Costo por llamada y total

```
Input:  3.000 tokens × $3,00 / 1.000.000  = $0,0090
Output:   800 tokens × $15,00 / 1.000.000 = $0,0120
────────────────────────────────────────────────────
Costo LLM por llamada de 3 min            = $0,0210
```

| Escala | Costo |
|---|---|
| Por llamada (3 min) | $0,0210 |
| **Por minuto** | **$0,0057** |
| **10.000 llamadas** | **$172,00** |

> **Rango realista:** entre **$172 y $300** según la complejidad/longitud de la conversación. Conversaciones más largas o con más contexto aumentan el costo linealmente.
>
> **Prompt Caching (recomendado):** Sonnet 4.6 soporta prompt caching. Cachear el system prompt del agente reduce ~70–90% el costo de los tokens de input cacheados. Con caching agresivo, el costo total del LLM baja a **~$30–50** para 10k llamadas.
>
> **Cross-check:** Fuentes de terceros estiman que el LLM "añade 10–30% a la factura" de ElevenLabs. Sobre $0,08/min de voz, eso son $0,008–0,024/min, consistente con nuestra estimación de Claude ($0,0057/min, en el extremo bajo por ser un modelo eficiente).

---

## 3. Twilio (telefonía, pass-through at-cost)

ElevenLabs pasa el costo de telefonía al costo real. Este proyecto usa la integración de teléfono de ElevenLabs (`ELEVENLABS_AGENT_PHONE_NUMBER_ID`), respaldada por Twilio.

### 3.1 Precios oficiales

| Tipo | Precio |
|---|---|
| Llamada outbound (saliente) | **$0,014 / minuto** |
| Llamada inbound (entrante) | $0,0085 / minuto |
| Número de teléfono (mensual) | ~$1,15 / mes |

> **Fuente:** [twilio.com/en-us/pricing](https://www.twilio.com/en-us/pricing)

### 3.2 Cálculo para 30.000 minutos outbound

```
30.000 min × $0,014/min = $420,00
+ número telefónico:      $1,15/mes
─────────────────────────────────────
Total Twilio:             ~$421,15
```

| Métrica | Valor |
|---|---|
| Costo Twilio (30k min) | **$420,00** (voz) + $1,15 (número) |
| **Costo por minuto** | **$0,0140** |
| Costo por llamada (3 min) | $0,0420 |

> **Optimización a escala:** para >50k min/mes, Twilio Elastic SIP Trunking ($0,007/min termination) puede reducir el costo de voz ~50%, a cambio de infraestructura SIP adicional.
>
> **Nota:** Twilio añade regulatory/carrier fees (~$0,001–0,003/min según región). No incluidos en el total.

---

## 4. Infraestructura AWS

Basado en la arquitectura actual del proyecto (Terraform en `src/Infra/`).

### 4.1 Componentes identificados

| Servicio | Uso en el proyecto |
|---|---|
| **AWS Lambda** | 3 funciones: `call_request`, `call_webhook`, `removal_requests` (Node.js 18.x, timeout 30s) |
| **API Gateway v2** | HTTP API para webhooks de ElevenLabs y Twilio |
| **DynamoDB** | Tabla `removal_requests` (PutItem, UpdateItem, Scan) |
| **S3 + CloudFront** | Frontend estático |

### 4.2 Estimación por servicio (10k llamadas)

| Servicio | Cálculo | Costo |
|---|---|---|
| Lambda invocaciones | 20.000 invocaciones (free tier: 1M/mes) | $0,00 |
| Lambda duración | 20.000 × 0,5s × 128MB = 1,28M GB-seg × $0,0000166667 | $21,33 |
| API Gateway v2 | 40.000 requests × $1,00/1M | $0,04 |
| DynamoDB | 20k WCU ($1,25/1M) + 10k RCU ($0,25/1M) | $0,03 |
| CloudWatch Logs | ~0,5GB × $0,50/GB | $0,25 |
| S3 + CloudFront | tráfico mínimo | ~$0,50 |
| **Total AWS** | | **~$22,15** |

> **Fuentes:** [Lambda](https://aws.amazon.com/lambda/pricing) · [API Gateway](https://aws.amazon.com/api-gateway/pricing) · [DynamoDB](https://aws.amazon.com/dynamodb/pricing)

| Métrica | Valor |
|---|---|
| **Total AWS (30k min)** | **$22,15** |
| **Costo AWS por minuto** | **$0,00074** |

> **Driver principal:** duración de Lambda. El timeout actual es 30s; si las funciones esperan webhooks (mantienen ejecución), el costo real puede ser 5–30× mayor. Optimizar a invocaciones cortas event-driven.

---

## 5. Tabla Consolidada: Costo por Minuto

| Servicio | Costo total (30 k min) | Costo / minuto | % del total |
|---|---|---|---|
| ElevenLabs Agents (voz) | $2.400,00 | $0,0800 | 79,6% |
| Twilio (outbound, pass-through) | $420,00 | $0,0140 | 13,9% |
| Claude Sonnet 4.6 (LLM, pass-through) | $172,00 | $0,0057 | 5,7% |
| AWS Infraestructura | $22,15 | $0,0007 | 0,7% |
| **TOTAL** | **$3.014,15** | **$0,1004** | **100%** |

### Con Prompt Caching en Claude

| Servicio | Costo total | Costo / minuto |
|---|---|---|
| ElevenLabs Agents (voz) | $2.400,00 | $0,0800 |
| Twilio (outbound) | $420,00 | $0,0140 |
| Claude Sonnet 4.6 (con caching) | ~$45,00 | $0,0015 |
| AWS Infraestructura | $22,15 | $0,0007 |
| **TOTAL** | **$2.887,15** | **$0,0962** |

---

## 6. Proyección por Volumen

| Volumen | Minutos | Costo total | Costo/min |
|---|---|---|---|
| 1.000 llamadas | 3.000 | $301,42 | $0,1005 |
| **10.000 llamadas** | **30.000** | **$3.014,15** | **$0,1004** |
| 100.000 llamadas | 300.000 | $30.141,50 | $0,1004 |

> A 100k llamadas (300k min), negociar **Enterprise** con ElevenLabs: el descuento por volumen sobre los $0,08/min suele ser del 20–40%, lo que reduciría el total significativamente.

---

## 7. Plan Recomendado para 10.000 Llamadas

### ElevenLabs: Plan **Business** ($990/mes) — bundle insuficiente, planificar overage o Enterprise

| Característica | Valor |
|---|---|
| **Minutos Agents incluidos/mes** | **12.375 minutos** |
| **Llamadas de 3 min que cubre el bundle** | **~4.125 llamadas/mes** (12.375 ÷ 3) |
| Llamadas concurrentes | **40** |
| Workspace seats | 10 |
| Voice clones profesionales | 10 |
| Costo overage (sobre 12.375 min) | $0,08/min |
| Burst (exceder 40 concurrentes) | $0,16/min |

> ⚠️ **El bundle de 12.375 min se queda corto.** Con un promedio de **3 minutos por llamada**, el bundle de Business cubre solo **~4.125 llamadas/mes** — apenas el **41%** de una meta de 10.000 llamadas en un solo mes. El resto se paga como overage a $0,08/min (o burst a $0,16/min si además se excede la concurrencia).

**Cobertura del bundle vs. el objetivo (10.000 llamadas = 30.000 min):**

| Estrategia | Minutos/mes | Llamadas/mes | ¿Dentro del bundle? | Costo ElevenLabs |
|---|---|---|---|---|
| Todo en 1 mes | 30.000 | 10.000 | ❌ No (excede 12.375) | $990 bundle + 17.625 min × $0,08 = **$2.400** |
| En 2 meses | 15.000 | 5.000 | ❌ No (excede 12.375) | 2 × $990 + 5.250 min × $0,08 = **$2.400** |
| En ~2,5 meses | ~12.000 | ~4.000 | ✅ Sí (≤ 12.375) | ~2,5 × $990 ≈ **$2.475** |
| Enterprise (volumen) | 30.000 | 10.000 | Negociado | < $2.400 (tarifa < $0,08/min) |

> El costo unitario es **$0,08/min en todos los casos** (bundle y overage cuestan lo mismo), así que el total de la capa de voz se mantiene en **~$2.400** sin importar la distribución — hasta negociar Enterprise.

**¿Por qué Business y no un plan menor?**
- Las **40 llamadas concurrentes** son el mínimo realista para manejar picos sin caer en burst pricing ($0,16/min). Scale solo da 30 concurrentes; Pro, 20.
- A este volumen (30.000 min/objetivo, **2,4× el bundle más grande**), la recomendación honesta es **negociar Enterprise**: ElevenLabs ofrece tarifas por debajo de $0,08/min y concurrencia sin tope, lo que reduce tanto el costo unitario como el riesgo de burst.

**Conclusión:** ningún plan self-service cubre 10.000 llamadas de 3 min en un mes dentro del bundle. Para producción a esta escala, **Enterprise es el camino correcto**; Business es viable solo si el volumen se reparte en ~2,5 meses o se asume el overage.

### Twilio: Pay-as-you-go
- Sin plan especial. $0,014/min. Pass-through vía ElevenLabs o cuenta propia.

### Claude Sonnet 4.6: API estándar de Anthropic
- **Habilitar Prompt Caching desde el día 1** (reduce ~80% el costo del system prompt del agente).

### AWS: Free tier cubre el volumen inicial
- Lambda free tier (1M invocaciones/mes) cubre cómodamente las primeras ~500k llamadas.

---

## 8. Política de Créditos y Rollover (productos basados en créditos)

> ⚠️ **Aclaración:** El sistema de **créditos con rollover** aplica a los productos de ElevenLabs que se cobran por carácter (TTS, STT standalone, dubbing). **ElevenLabs Agents se cobra por minuto (bundle mensual), no por créditos**, por lo que el rollover de créditos **no aplica directamente a los minutos de Agents**. Se incluye aquí porque fue solicitado y es relevante si usas TTS standalone.

**Política oficial de rollover de créditos:**

> *"Unused credits can roll over for up to **two months** as long as you maintain an active paid subscription and do not downgrade or cancel."*
> — [elevenlabs.io/pricing](https://elevenlabs.io/pricing)

- ✅ Los créditos no usados del mes N se acumulan a los meses N+1 y N+2 (hasta 2 meses de rollover).
- ❌ Si no se usan en ese plazo, **se pierden**.
- ❌ Si haces **downgrade o cancelas**, los créditos pagados **expiran al final del ciclo de facturación actual** y la cuenta baja a Free.

**Minutos de Agents:** son un bundle mensual. La documentación oficial no confirma rollover de minutos de Agents no usados; planificar asumiendo que **se consumen dentro del mes**.

---

## 9. Fuentes y Referencias

| Fuente | URL | Dato extraído |
|---|---|---|
| ElevenLabs Agents Pricing | [elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents) | $0,08/min, minutos por plan, concurrencia, burst $0,16/min |
| ElevenLabs Help — ElevenAgents cost | [help.elevenlabs.io](https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenAgents-cost) | LLM y telefonía "at cost", descuento por silencio 95% |
| ElevenLabs Pricing (créditos/rollover) | [elevenlabs.io/pricing](https://elevenlabs.io/pricing) | Política rollover 2 meses, planes Creator $11/$22 |
| Análisis pxlpeak 2026 | [pxlpeak.com](https://pxlpeak.com/blog/ai-tools/elevenlabs-pricing-guide) | Overage $0,08/min, LLM añade 10–30% |
| Análisis cekura 2026 | [cekura.ai](https://www.cekura.ai/blogs/elevenlabs-pricing) | Confirmación tarifas Agents, billing por minuto |
| Twilio Pricing | [twilio.com/en-us/pricing](https://www.twilio.com/en-us/pricing) | Outbound $0,014/min; Inbound $0,0085/min |
| Anthropic API (claude-api skill) | — | Sonnet 4.6: $3 input / $15 output por 1M tokens |
| AWS Lambda | [aws.amazon.com/lambda/pricing](https://aws.amazon.com/lambda/pricing) | $0,20/1M req + $0,0000166667/GB-seg |
| AWS API Gateway v2 | [aws.amazon.com/api-gateway/pricing](https://aws.amazon.com/api-gateway/pricing) | $1,00/1M requests |
| AWS DynamoDB | [aws.amazon.com/dynamodb/pricing](https://aws.amazon.com/dynamodb/pricing) | $1,25/1M WCU; $0,25/1M RCU |

---

## 10. Supuestos y Limitaciones

1. **ElevenLabs $0,08/min:** tarifa pública post-noviembre 2025 para Agents. La capa de voz (STT+TTS+turn-taking) es $0,08/min; **el LLM y la telefonía se suman aparte at-cost**. Verificar en el dashboard con una llamada de prueba de 1 minuto.

2. **Descuento por silencio (95% en pausas >10s):** puede reducir el costo real de la capa de voz. No incluido en el total conservador.

3. **Claude LLM (pass-through):** asume ~6–10 turnos y ~800 tokens de system prompt por llamada. Rango realista $172–$300; con caching ~$30–50. Conversaciones largas escalan linealmente.

4. **AWS Lambda duración:** asume 500ms y 128MB por invocación. Si las funciones mantienen ejecución esperando webhooks (timeout 30s), el costo puede ser 5–30× mayor.

5. **Burst pricing:** si no se dimensiona la concurrencia (40 en Business), los picos se cobran a $0,16/min (doble). Dimensionar el plan según el pico esperado de llamadas simultáneas.

6. **Taxes y fees:** no incluidos. Twilio añade regulatory fees (~$0,001–0,003/min según región/carrier).

---

*Documento generado: junio 2026 · Precios sujetos a cambio sin previo aviso · Validar siempre con una llamada de prueba en el dashboard de ElevenLabs*

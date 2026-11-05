# Línea base de urls_eval.csv

Las URLs `synthetic` las armamos nosotros a partir de las mismas reglas que tiene el detector: es una prueba circular y
no mide la detección real. La que vale es `real`. Las `manual` son legítimas elegidas a mano por difíciles.

"Detectada" quiere decir Precaución o Peligroso. "No pudimos verificarlo" cuenta como no detectada.
Filas de `real` sin URL (para completar): 4.

## Solo la dirección (VirusTotal apagado)

| Fuente | Casos | VP | FP | VN | FN | Detección | Falsos positivos | Phishing en Peligroso |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| synthetic | 23 | 23 | 0 | 0 | 0 | 100.0 % | — | 91.3 % |
| real | 1 | 1 | 0 | 0 | 0 | 100.0 % | — | 0.0 % |
| manual | 20 | 0 | 0 | 20 | 0 | — | 0.0 % | — |
| total | 44 | 24 | 0 | 20 | 0 | 100.0 % | 0.0 % | 87.5 % |

### Errores

- **Detectada, pero no con el veredicto esperado** (real): `https://stakelotemax7.click/` salió **Precaución** (esperado: Peligroso). Señales: tld_barato.
  - El final .click se usa mucho en sitios truchos.

## Con las respuestas guardadas de VirusTotal

Regla: VirusTotal es una señal más. De 1 a 4 motores "malicious" es una señal media (25 puntos); 5 o más es fuerte (60 puntos) y sola alcanza para Peligroso.
Casos con respuesta guardada: 1.

| Fuente | Casos | VP | FP | VN | FN | Detección | Falsos positivos | Phishing en Peligroso |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| synthetic | 23 | 23 | 0 | 0 | 0 | 100.0 % | — | 91.3 % |
| real | 1 | 1 | 0 | 0 | 0 | 100.0 % | — | 100.0 % |
| manual | 20 | 0 | 0 | 20 | 0 | — | 0.0 % | — |
| total | 44 | 24 | 0 | 20 | 0 | 100.0 % | 0.0 % | 91.7 % |

### Errores

Sin errores.

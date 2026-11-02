# Evaluación del motor de SafeLink

Generado por `npm run eval` (frontend/eval/evaluar.js). Evalúa el análisis local de la dirección (`analizar`),
el mismo que corre en el teléfono y en la web antes de consultar al servidor. No incluye el seguimiento de
redirecciones, la edad del dominio ni las bases de amenazas, porque dependen de la red.

Legítimos de Tranco: top 1000 de la lista V354N (2026-11-01), https://tranco-list.eu/list/V354N/1000000.

## Resumen

| Medida | Valor | Umbral |
| --- | --- | --- |
| Casos | 3281 |  |
| Legítimos | 1102 |  |
| Maliciosos | 2179 |  |
| Falsos positivos (legítimo en Sospechoso o Peligroso) | 3.27 % | ≤ 3.27 % |
| Detección (malicioso en Sospechoso o Peligroso) | 99.54 % | ≥ 99.54 % |
| Maliciosos en No pudimos verificarlo | 0.46 % | ≤ 0.46 % |
| Legítimos en No pudimos verificarlo | 6.08 % |  |
| Imitaciones de marca en Sin señales (regla dura) | 0 | = 0 |

**Pasa todos los umbrales.**

## Matriz de confusión

| Esperado | verde (Sin señales) | gris (No pudimos verificarlo) | amarillo (Sospechoso) | rojo (Peligroso) |
| --- | --- | --- | --- | --- |
| legitimo | 999 | 67 | 36 | 0 |
| malicioso | 0 | 10 | 1850 | 319 |

## Por categoría

| Esperado | Categoría | Casos | verde | gris | amarillo | rojo |
| --- | --- | --- | --- | --- | --- | --- |
| legitimo | tranco | 1000 | 909 | 55 | 36 | 0 |
| legitimo | argentino | 58 | 58 | 0 | 0 | 0 |
| legitimo | url-larga | 12 | 12 | 0 | 0 | 0 |
| legitimo | mapas | 6 | 4 | 2 | 0 | 0 |
| legitimo | acortador | 9 | 0 | 9 | 0 | 0 |
| legitimo | subdominio | 16 | 15 | 1 | 0 | 0 |
| malicioso | typosquat | 2164 | 0 | 10 | 1845 | 309 |
| malicioso | borde | 11 | 0 | 0 | 1 | 10 |
| legitimo | borde | 1 | 1 | 0 | 0 | 0 |
| malicioso | regresion | 4 | 0 | 0 | 4 | 0 |

## Maliciosos por técnica

| Técnica | Casos | verde | gris | amarillo | rojo | Detección |
| --- | --- | --- | --- | --- | --- | --- |
| leet | 212 | 0 | 0 | 212 | 0 | 100.00 % |
| homoglifo | 213 | 0 | 0 | 0 | 213 | 100.00 % |
| omision | 383 | 0 | 0 | 383 | 0 | 100.00 % |
| transposicion | 339 | 0 | 0 | 339 | 0 | 100.00 % |
| insercion | 735 | 0 | 0 | 727 | 8 | 100.00 % |
| malformado | 264 | 0 | 10 | 166 | 88 | 96.21 % |
| pares | 18 | 0 | 0 | 18 | 0 | 100.00 % |
| userinfo | 2 | 0 | 0 | 0 | 2 | 100.00 % |
| userinfo-codificado | 1 | 0 | 0 | 1 | 0 | 100.00 % |
| ip-decimal | 1 | 0 | 0 | 0 | 1 | 100.00 % |
| ip-hexadecimal | 1 | 0 | 0 | 0 | 1 | 100.00 % |
| ip-octal | 1 | 0 | 0 | 0 | 1 | 100.00 % |
| punycode | 2 | 0 | 0 | 0 | 2 | 100.00 % |
| unicode | 1 | 0 | 0 | 0 | 1 | 100.00 % |
| subdominio-marca | 1 | 0 | 0 | 0 | 1 | 100.00 % |
| barra-invertida | 1 | 0 | 0 | 0 | 1 | 100.00 % |
| regresion | 4 | 0 | 0 | 4 | 0 | 100.00 % |

## Qué señal produjo cada veredicto

Cuántos veredictos sumaron puntos con cada señal. "Decisiva" es la que más puntos aportó en ese caso.
El detalle de cada caso está en `eval/resultados.csv`.

| Señal | En legítimos | En maliciosos | Decisiva |
| --- | --- | --- | --- |
| `marca_parecido` | 8 | 1109 | 1117 |
| `marca_nombre` | 27 | 352 | 379 |
| `marca_letras` | 0 | 316 | 316 |
| `marca_alfabeto` | 0 | 216 | 216 |
| `marca_en_enlace_invalido` | 0 | 169 | 169 |
| `ip` | 0 | 4 | 3 |
| `arroba_userinfo` | 0 | 2 | 2 |
| `barra_invertida` | 0 | 1 | 1 |
| `dato_codificado` | 1 | 0 | 1 |
| `marca_subdominio` | 0 | 1 | 1 |
| `muchos_guiones` | 1 | 0 | 1 |
| `tld_barato` | 1 | 2 | 1 |
| `arroba_en_camino` | 0 | 1 | 0 |
| `ip_disfrazada` | 0 | 3 | 0 |
| `nombre_senuelo` | 0 | 10 | 0 |
| `palabras_gancho` | 0 | 1 | 0 |
| `piso_marca_mas_senal_fuerte` | 0 | 312 | 0 |
| `prefijo_www_falso` | 0 | 88 | 0 |
| `ruta_sensible` | 0 | 1 | 0 |
| `sin_https` | 0 | 3 | 0 |

## Falsos positivos (36)

| Dirección | Categoría | Nivel | Señales |
| --- | --- | --- | --- |
| https://mail.ru/ | tranco | amarillo | marca_parecido |
| https://apple-dns.net/ | tranco | amarillo | marca_nombre |
| https://tiktokv.com/ | tranco | amarillo | marca_parecido |
| https://skybridge.click/ | tranco | amarillo | tld_barato |
| https://amazon.dev/ | tranco | amarillo | marca_nombre |
| https://amazon-adsystem.com/ | tranco | amarillo | marca_nombre |
| https://google-analytics.com/ | tranco | amarillo | marca_nombre |
| https://youtube-nocookie.com/ | tranco | amarillo | marca_nombre |
| https://cdn-apple.com/ | tranco | amarillo | marca_nombre |
| https://telegram.me/ | tranco | amarillo | marca_nombre |
| https://media-amazon.com/ | tranco | amarillo | marca_nombre |
| https://amazon.co.uk/ | tranco | amarillo | marca_nombre |
| https://google.cn/ | tranco | amarillo | marca_nombre |
| https://amazon.de/ | tranco | amarillo | marca_nombre |
| https://tiktokv.us/ | tranco | amarillo | marca_parecido |
| https://netflix.net/ | tranco | amarillo | marca_nombre |
| https://tiktokv.eu/ | tranco | amarillo | marca_parecido |
| https://tencent-cloud.net/ | tranco | amarillo | marca_parecido |
| https://facebook.net/ | tranco | amarillo | marca_nombre |
| https://amazon.co.jp/ | tranco | amarillo | marca_nombre |
| https://google.de/ | tranco | amarillo | marca_nombre |
| https://google.com.hk/ | tranco | amarillo | marca_nombre |
| https://discord.media/ | tranco | amarillo | marca_nombre |
| https://icloud-content.com/ | tranco | amarillo | marca_nombre |
| https://hicloud.com/ | tranco | amarillo | marca_parecido |
| https://amazon.fr/ | tranco | amarillo | marca_nombre |
| https://amazon.ca/ | tranco | amarillo | marca_nombre |
| https://amazon.in/ | tranco | amarillo | marca_nombre |
| https://amazon.it/ | tranco | amarillo | marca_nombre |
| https://google.co.uk/ | tranco | amarillo | marca_nombre |
| https://discordapp.com/ | tranco | amarillo | marca_nombre |
| https://px-cloud.net/ | tranco | amarillo | marca_parecido |
| https://amazon.co.za/ | tranco | amarillo | marca_nombre |
| https://ssl-images-amazon.com/ | tranco | amarillo | marca_nombre |
| https://tiktokw.us/ | tranco | amarillo | marca_parecido |
| https://amazon.com.au/ | tranco | amarillo | marca_nombre |

## Maliciosos no detectados (10)

| Dirección | Técnica | Marca | Nivel | Señales |
| --- | --- | --- | --- | --- |
| wwww.gali'cia.-com | malformado | galicia | gris | sin puntos (sin_formato) |
| galicia.-com | malformado | galicia | gris | sin puntos (sin_formato) |
| wwww.mac'ro.-com | malformado | macro | gris | sin puntos (sin_formato) |
| macro.-com | malformado | macro | gris | sin puntos (sin_formato) |
| wwww.mo'do.-com | malformado | modo | gris | sin puntos (sin_formato) |
| modo.-com | malformado | modo | gris | sin puntos (sin_formato) |
| wwww.cla'ro.-com | malformado | claro | gris | sin puntos (sin_formato) |
| claro.-com | malformado | claro | gris | sin puntos (sin_formato) |
| wwww.pers'onal.-com | malformado | personal | gris | sin puntos (sin_formato) |
| personal.-com | malformado | personal | gris | sin puntos (sin_formato) |

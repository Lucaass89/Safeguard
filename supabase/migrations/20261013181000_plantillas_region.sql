-- Bancos, ARCA, colegios y envíos. No pisa las plantillas que ya existen.
-- El cuerpo usa {link} y la lección va en metadata.lesson, igual que las anteriores.

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'Banco Galicia — compra que no hiciste',
  'Galicia: compra de $186.400 en un comercio',
  'Banco Galicia <alertas@galicia-aviso.com>',
  E'Hola,\n\nRegistramos una compra con tu tarjeta Galicia Visa por $186.400.\nSi no fuiste vos, anulala ahora:\n\n{link}\n\nSi no respondés en 2 horas, el cargo queda firme.\n\nBanco Galicia',
  'alto',
  'BANCO',
  'email',
  '{"lesson":{"titulo":"El banco no anula un cargo por un enlace del mail","cuerpo":"Galicia avisa dentro de Online Banking o la app, con la sesión que ya tenés abierta. Un mail que apura a anular ahora y manda a otro sitio pide la clave afuera del banco."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'Banco Galicia — compra que no hiciste'
);

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'Banco Nación — clave de home banking',
  'BNA: tu clave de home banking vence hoy',
  'Banco Nación <seguridad@bna-acceso.com>',
  E'Estimado cliente,\n\nPor una actualización de seguridad, tu clave de home banking vence hoy a las 18.\nRenovala acá para no quedar sin acceso:\n\n{link}\n\nBanco de la Nación Argentina',
  'alto',
  'BANCO',
  'email',
  '{"lesson":{"titulo":"La clave no se renueva por un enlace","cuerpo":"El Banco Nación no pide la clave por correo ni avisa que vence hoy. Se entra escribiendo hb.redlink.com.ar o desde la app oficial, no desde un botón del mensaje."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'Banco Nación — clave de home banking'
);

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'ARCA — tenés una devolución',
  'ARCA: devolución de $48.900 disponible',
  'ARCA <devoluciones@arca-gob.com>',
  E'Contribuyente,\n\nTenés una devolución de $48.900 a favor. Para acreditarla en tu cuenta hay que confirmar el CBU antes del viernes:\n\n{link}\n\nARCA — Agencia de Recaudación y Control Aduanero',
  'alto',
  'ORGANISMO',
  'email',
  '{"lesson":{"titulo":"ARCA no deposita por un enlace","cuerpo":"Una devolución de AFIP o ARCA se ve entrando a arca.gob.ar, escrito por uno mismo. Un mail que pide el CBU o la clave fiscal para acreditar es el anzuelo."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'ARCA — tenés una devolución'
);

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'Colegio — cuota vencida',
  'Cuota de marzo vencida',
  'Administración <cuotas@colegio-pagos.com>',
  E'Familia,\n\nLa cuota de marzo figura impaga. Para evitar el recargo, pagala hoy con este enlace:\n\n{link}\n\nAdministración',
  'medio',
  'COLEGIO',
  'email',
  '{"lesson":{"titulo":"La cuota no se paga por un enlace suelto","cuerpo":"El colegio cobra por el medio que ya usa la familia: el portal, la transferencia a la cuenta conocida o la administración. Un mail nuevo con un botón de pago no reemplaza ese canal."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'Colegio — cuota vencida'
);

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'Colegio — circular de la dirección',
  'Circular',
  'Dirección',
  E'Dirección  ·  ahora\nFamilias, salió la circular de la salida educativa. Confirmen la autorización acá: {link}',
  'bajo',
  'COLEGIO',
  'whatsapp',
  '{"lesson":{"titulo":"La circular llega por el canal del colegio","cuerpo":"Una autorización se manda por el cuaderno de comunicaciones, el campus o el grupo que la escuela ya usa. Un WhatsApp de un número nuevo, aunque diga Dirección, no alcanza para confirmar datos del alumno."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'Colegio — circular de la dirección'
);

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'OCA — tu envío está en camino',
  'OCA',
  'OCA',
  E'OCA: tu envio esta en camino. Seguí el paquete y confirmá la dirección: {link}',
  'medio',
  'PAQUETE',
  'sms',
  '{"lesson":{"titulo":"El seguimiento se abre en oca.com.ar","cuerpo":"OCA muestra el envío en su sitio, con el número de seguimiento. Un SMS con un enlace corto para confirmar la dirección pide datos que el correo ya tiene."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'OCA — tu envío está en camino'
);

insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html, nivel_dificultad, categoria, canal, metadata
)
select
  'Mercado Envíos — no pudimos dejar el pedido',
  'Mercado Envíos',
  'Mercado Envíos',
  E'Mercado Envíos  ·  hoy\nNo pudimos dejar tu pedido. Reprogramá la entrega en las próximas 24 h: {link}',
  'medio',
  'PAQUETE',
  'whatsapp',
  '{"lesson":{"titulo":"El envío se ve dentro de Mercado Libre","cuerpo":"Mercado Envíos avisa en la compra, dentro de la app o el sitio donde ya iniciaste sesión. Un WhatsApp para reprogramar y cargar la dirección otra vez no es el aviso del pedido."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing where titulo = 'Mercado Envíos — no pudimos dejar el pedido'
);

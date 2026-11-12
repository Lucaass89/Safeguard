-- El convenio piloto (cláusula 5.2) no permite usar marcas reales sin su permiso ni beneficios económicos
-- como anzuelo. Las plantillas con bancos, organismos, correos y tiendas reales pasan a marcas ficticias.

update public.plantillas_phishing set
  titulo = 'Banco Ceibo — compra que no hiciste',
  asunto_mail = 'Banco Ceibo: compra de $186.400 en un comercio',
  remitente_falso = 'Banco Ceibo <alertas@ceibo-aviso.com>',
  cuerpo_html = E'Hola,\n\nRegistramos una compra con tu tarjeta Ceibo Visa por $186.400.\nSi no fuiste vos, anulala ahora:\n\n{link}\n\nSi no respondés en 2 horas, el cargo queda firme.\n\nBanco Ceibo',
  metadata = '{"lesson":{"titulo":"El banco no anula un cargo por un enlace del mail","cuerpo":"Un banco avisa dentro de su app o de su home banking, con la sesión que ya tenés abierta. Un mail que apura a anular ahora y manda a otro sitio pide la clave afuera del banco."}}'::jsonb
where titulo = 'Banco Galicia — compra que no hiciste';

update public.plantillas_phishing set
  titulo = 'Banco Aurora — clave de home banking',
  asunto_mail = 'Banco Aurora: tu clave de home banking vence hoy',
  remitente_falso = 'Banco Aurora <seguridad@bancoaurora-acceso.com>',
  cuerpo_html = E'Estimado cliente,\n\nPor una actualización de seguridad, tu clave de home banking vence hoy a las 18.\nRenovala acá para no quedar sin acceso:\n\n{link}\n\nBanco Aurora',
  metadata = '{"lesson":{"titulo":"La clave no se renueva por un enlace","cuerpo":"Un banco no pide la clave por correo ni avisa que vence hoy. Se entra escribiendo la dirección del banco o desde su app oficial, no desde un botón del mensaje."}}'::jsonb
where titulo = 'Banco Nación — clave de home banking';

update public.plantillas_phishing set
  titulo = 'Agencia de Recaudación — datos fiscales',
  asunto_mail = 'Agencia de Recaudación: actualizá tus datos antes del viernes',
  remitente_falso = 'Agencia de Recaudación <avisos@recaudacion-gob.com>',
  cuerpo_html = E'Contribuyente,\n\nPara mantener activo tu domicilio fiscal electrónico tenés que confirmar tus datos y tu CBU antes del viernes:\n\n{link}\n\nAgencia de Recaudación',
  metadata = '{"lesson":{"titulo":"El organismo fiscal no pide datos por un enlace","cuerpo":"Un trámite fiscal se hace entrando vos al sitio oficial del organismo, con tu clave. Un mail que apura con una fecha y pide el CBU o la clave fiscal desde un botón es el anzuelo."}}'::jsonb
where titulo = 'ARCA — tenés una devolución';

update public.plantillas_phishing set
  titulo = 'Organismo fiscal — intimación por mail',
  remitente_falso = 'Agencia de Recaudación',
  metadata = '{"lesson":{"titulo":"El organismo fiscal no manda un link genérico","cuerpo":"Una intimación verdadera está en el domicilio fiscal electrónico, dentro del sitio oficial. Si el remitente no es un dominio oficial, no entres."}}'::jsonb
where titulo = 'AFIP — intimación por mail';

update public.plantillas_phishing set
  remitente_falso = 'Correo Nacional',
  metadata = '{"lesson":{"titulo":"El correo no cobra por un SMS","cuerpo":"El paquete retenido es la estafa más común de la región. Un correo de verdad no manda un link genérico ni pide una tasa por mensaje de texto."}}'::jsonb
where titulo = 'Paquete retenido — SMS';

update public.plantillas_phishing set
  remitente_falso = 'Rutamax Envíos',
  metadata = '{"lesson":{"titulo":"La empresa de envíos no te escribe por WhatsApp personal","cuerpo":"Las empresas de envíos y las tiendas avisan en su app o por mail. Un chat de WhatsApp con un link corto es el cebo."}}'::jsonb
where titulo = 'Paquete retenido — WhatsApp';

update public.plantillas_phishing set
  titulo = 'Rutamax — tu envío está en camino',
  asunto_mail = 'Rutamax',
  remitente_falso = 'Rutamax',
  cuerpo_html = E'Rutamax: tu envio esta en camino. Seguí el paquete y confirmá la dirección: {link}',
  metadata = '{"lesson":{"titulo":"El seguimiento se abre en el sitio de la empresa","cuerpo":"Una empresa de envíos muestra el paquete en su sitio, con el número de seguimiento. Un SMS con un enlace corto para confirmar la dirección pide datos que la empresa ya tiene."}}'::jsonb
where titulo = 'OCA — tu envío está en camino';

update public.plantillas_phishing set
  titulo = 'Vitrina Envíos — no pudimos dejar el pedido',
  asunto_mail = 'Vitrina Envíos',
  remitente_falso = 'Vitrina Envíos',
  cuerpo_html = E'Vitrina Envíos  ·  hoy\nNo pudimos dejar tu pedido. Reprogramá la entrega en las próximas 24 h: {link}',
  metadata = '{"lesson":{"titulo":"El envío se ve dentro de la tienda","cuerpo":"Una tienda avisa del envío en la compra, dentro de la app o el sitio donde ya iniciaste sesión. Un WhatsApp para reprogramar y cargar la dirección otra vez no es el aviso del pedido."}}'::jsonb
where titulo = 'Mercado Envíos — no pudimos dejar el pedido';

update public.plantillas_phishing set
  titulo = 'Compra pendiente en Vitrina',
  remitente_falso = 'Vitrina',
  categoria = 'TIENDA',
  cuerpo_html = 'Hola. Registramos un pedido a tu nombre y el pago no se completó. Si no lo confirmás en las próximas 24 horas, se cancela y se libera el producto.' || E'\n\n' || 'Confirmá la compra desde este aviso:' || E'\n' || '{link}' || E'\n\n' || 'Vitrina',
  metadata = '{"lesson":{"titulo":"La tienda de verdad no se abre desde un mail","cuerpo":"Si fuera el sitio oficial, la barra del navegador diría la dirección de la tienda. Una compra se hace entrando vos a la app o al sitio que ya conocés, no desde un enlace que llegó en un mensaje."}}'::jsonb
where titulo = 'Compra pendiente en Mercado Libre';

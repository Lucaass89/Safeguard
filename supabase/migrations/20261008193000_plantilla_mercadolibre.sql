insert into public.plantillas_phishing (
  titulo, asunto_mail, remitente_falso, cuerpo_html,
  nivel_dificultad, categoria, canal, metadata
)
select
  'Compra pendiente en Mercado Libre',
  'Tu compra quedó pendiente de pago',
  'Mercado Libre',
  'Hola. Registramos un pedido a tu nombre y el pago no se completó. Si no lo confirmás en las próximas 24 horas, se cancela y se libera el producto.' || E'\n\n' || 'Confirmá la compra desde este aviso:' || E'\n' || '{link}' || E'\n\n' || 'Mercado Libre',
  'alto',
  'MERCADOLIBRE',
  'email',
  '{"lesson":{"titulo":"La tienda de verdad no se abre desde un mail","cuerpo":"Si fuera el sitio oficial, la barra del navegador diría mercadolibre.com.ar. Una compra se hace entrando vos a la app o al sitio que ya conocés, no desde un enlace que llegó en un mensaje."}}'::jsonb
where not exists (
  select 1 from public.plantillas_phishing p where p.titulo = 'Compra pendiente en Mercado Libre'
);

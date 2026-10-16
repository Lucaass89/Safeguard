-- Darkconsole no se usa. Se quitan las funciones que solo abría esa pantalla.

drop function if exists public.phishguard_darkconsole_lanzar(text, text, uuid, text, uuid[]);
drop function if exists public.phishguard_darkconsole_lanzar(text, text, uuid, uuid[]);
drop function if exists public.phishguard_darkconsole();
drop function if exists public.phishguard_es_encargado();

-- Kalú Admin demo seed
-- Ejecutar en Supabase SQL Editor.
-- No crea tablas ni columnas. Inserta solo en tablas existentes y filtra columnas inexistentes.

begin;

create extension if not exists pgcrypto;

create or replace function pg_temp.kalu_table_exists(p_table text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = p_table
  );
$$;

create or replace function pg_temp.kalu_column_exists(p_table text, p_column text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_column
  );
$$;

create or replace function pg_temp.kalu_first_column(p_table text, p_candidates text[])
returns text
language sql
stable
as $$
  select c.column_name
  from unnest(p_candidates) with ordinality candidate(column_name, ord)
  join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = p_table
   and c.column_name = candidate.column_name
  order by candidate.ord
  limit 1;
$$;

create or replace function pg_temp.kalu_primary_key(p_table text)
returns text
language sql
stable
as $$
  select a.attname
  from pg_index i
  join pg_class t on t.oid = i.indrelid
  join pg_namespace n on n.oid = t.relnamespace
  join pg_attribute a on a.attrelid = t.oid and a.attnum = any(i.indkey)
  where n.nspname = 'public'
    and t.relname = p_table
    and i.indisprimary
  order by a.attnum
  limit 1;
$$;

create or replace function pg_temp.kalu_fk_value(p_table text, p_column text)
returns text
language sql
stable
as $$
  select null::text;
$$;

create or replace function pg_temp.kalu_insert_json(p_table text, p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  target_regclass regclass;
  payload jsonb := p_payload;
  col_list text;
  value_list text;
  required_missing text[];
  required_col text;
  fk_value text;
  inserted jsonb;
begin
  if not pg_temp.kalu_table_exists(p_table) then
    raise notice '[seed] tabla % no existe; omitida', p_table;
    return null;
  end if;

  target_regclass := format('public.%I', p_table)::regclass;

  select coalesce(payload || jsonb_object_agg(a.attname, gen_random_uuid()::text), payload)
    into payload
  from pg_attribute a
  join pg_class t on t.oid = a.attrelid
  join pg_namespace n on n.oid = t.relnamespace
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  left join pg_constraint fk
    on fk.conrelid = t.oid
   and fk.contype = 'f'
   and a.attnum = any(fk.conkey)
  where n.nspname = 'public'
    and t.relname = p_table
    and a.attnum > 0
    and not a.attisdropped
    and a.attnotnull
    and a.atttypid = 'uuid'::regtype
    and d.adbin is null
    and fk.oid is null
    and not payload ? a.attname;

  for required_col in
    select a.attname
    from pg_attribute a
    join pg_class t on t.oid = a.attrelid
    join pg_namespace n on n.oid = t.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where n.nspname = 'public'
      and t.relname = p_table
      and a.attnum > 0
      and not a.attisdropped
      and a.attnotnull
      and a.attgenerated = ''
      and d.adbin is null
      and not payload ? a.attname
  loop
    fk_value := pg_temp.kalu_fk_value(p_table, required_col);
    if fk_value is not null then
      payload := jsonb_set(payload, array[required_col], to_jsonb(fk_value), true);
    end if;
  end loop;

  select array_agg(a.attname)
    into required_missing
  from pg_attribute a
  join pg_class t on t.oid = a.attrelid
  join pg_namespace n on n.oid = t.relnamespace
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where n.nspname = 'public'
    and t.relname = p_table
    and a.attnum > 0
    and not a.attisdropped
    and a.attnotnull
    and a.attgenerated = ''
    and d.adbin is null
    and not payload ? a.attname;

  if required_missing is not null then
    raise exception '[seed] %. columnas obligatorias sin valor: %', p_table, array_to_string(required_missing, ', ');
  end if;

  select
    string_agg(format('%I', a.attname), ', ' order by a.attnum),
    string_agg(
      case
        when a.atttypid in ('json'::regtype, 'jsonb'::regtype)
          then format('($1->%L)::%s', a.attname, format_type(a.atttypid, a.atttypmod))
        else format('($1->>%L)::%s', a.attname, format_type(a.atttypid, a.atttypmod))
      end,
      ', ' order by a.attnum
    )
    into col_list, value_list
  from jsonb_object_keys(payload) key(column_name)
  join pg_attribute a on a.attrelid = target_regclass and a.attname = key.column_name
  where a.attnum > 0
    and not a.attisdropped
    and a.attgenerated = '';

  if col_list is null then
    raise notice '[seed] tabla % sin columnas compatibles; omitida', p_table;
    return null;
  end if;

  execute format(
    'insert into public.%I (%s) values (%s) on conflict do nothing returning to_jsonb(%I.*)',
    p_table,
    col_list,
    value_list,
    p_table
  )
  using payload
  into inserted;

  raise notice '[seed] tabla %, columnas usadas: %', p_table, col_list;
  return inserted;
end;
$$;

create or replace function pg_temp.kalu_first_pk_value(p_table text)
returns text
language plpgsql
as $$
declare
  pk text := pg_temp.kalu_primary_key(p_table);
  value text;
begin
  if pk is null or not pg_temp.kalu_table_exists(p_table) then
    return null;
  end if;

  execute format('select %I::text from public.%I order by %I limit 1', pk, p_table, pk)
    into value;

  return value;
end;
$$;

create or replace function pg_temp.kalu_find_pk_value(p_table text, p_column text, p_value text)
returns text
language plpgsql
as $$
declare
  pk text := pg_temp.kalu_primary_key(p_table);
  value text;
begin
  if pk is null or p_column is null or not pg_temp.kalu_column_exists(p_table, p_column) then
    return null;
  end if;

  execute format('select %I::text from public.%I where %I::text = $1 limit 1', pk, p_table, p_column)
    using p_value
    into value;

  return value;
end;
$$;

create or replace function pg_temp.kalu_seed_lookup(p_table text, p_label text)
returns text
language plpgsql
as $$
declare
  pk_value text;
  name_col text;
  payload jsonb := '{}'::jsonb;
begin
  if not pg_temp.kalu_table_exists(p_table) then
    return null;
  end if;

  pk_value := pg_temp.kalu_first_pk_value(p_table);
  if pk_value is not null then
    return pk_value;
  end if;

  name_col := pg_temp.kalu_first_column(p_table, array['nombre', 'name', 'titulo', 'descripcion', 'estado']);
  if name_col is not null then
    payload := jsonb_set(payload, array[name_col], to_jsonb(p_label), true);
  end if;

  if pg_temp.kalu_column_exists(p_table, 'activo') then
    payload := jsonb_set(payload, array['activo'], 'true'::jsonb, true);
  end if;

  if pg_temp.kalu_column_exists(p_table, 'created_at') then
    payload := jsonb_set(payload, array['created_at'], to_jsonb(now()::text), true);
  end if;

  perform pg_temp.kalu_insert_json(p_table, payload);
  return pg_temp.kalu_first_pk_value(p_table);
end;
$$;

create or replace function pg_temp.kalu_fk_value(p_table text, p_column text)
returns text
language plpgsql
as $$
declare
  referenced_table text;
  referenced_column text;
  value text;
begin
  select rt.relname, ra.attname
    into referenced_table, referenced_column
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join pg_class rt on rt.oid = c.confrelid
  join pg_attribute a on a.attrelid = t.oid and a.attnum = c.conkey[1]
  join pg_attribute ra on ra.attrelid = rt.oid and ra.attnum = c.confkey[1]
  where n.nspname = 'public'
    and t.relname = p_table
    and a.attname = p_column
    and c.contype = 'f'
  limit 1;

  if referenced_table is null then
    return null;
  end if;

  value := pg_temp.kalu_first_pk_value(referenced_table);

  if value is null then
    value := pg_temp.kalu_seed_lookup(referenced_table, 'Demo Kalú');
  end if;

  return value;
end;
$$;

do $$
declare
  cliente_email_col text;
  producto_name_col text;
  insumo_name_col text;
  cliente_ana text;
  cliente_luis text;
  producto_torta text;
  producto_brownie text;
  insumo_chocolate text;
  insumo_harina text;
  pedido_1 jsonb;
  pedido_2 jsonb;
  pedido_1_id text;
  pedido_2_id text;
  categoria_id text;
  estado_pedido_id text;
  metodo_pago_id text;
  payload jsonb;
begin
  categoria_id := pg_temp.kalu_seed_lookup('categorias', 'Tortas');
  estado_pedido_id := pg_temp.kalu_seed_lookup('estados_pedido', 'Entregado');
  metodo_pago_id := pg_temp.kalu_seed_lookup('metodos_pago', 'Yape');

  cliente_email_col := pg_temp.kalu_first_column('clientes', array['email', 'correo', 'correo_electronico']);

  payload := jsonb_build_object(
    'nombres', 'Ana',
    'nombre', 'Ana',
    'apellidos', 'Torres',
    'apellido', 'Torres',
    'telefono', '999111222',
    'email', 'ana.demo@kalu.local',
    'correo', 'ana.demo@kalu.local',
    'activo', true,
    'created_at', now()::text,
    'fecha_registro', current_date::text
  );
  perform pg_temp.kalu_insert_json('clientes', payload);
  cliente_ana := coalesce(pg_temp.kalu_find_pk_value('clientes', cliente_email_col, 'ana.demo@kalu.local'), pg_temp.kalu_first_pk_value('clientes'));

  payload := jsonb_build_object(
    'nombres', 'Luis',
    'nombre', 'Luis',
    'apellidos', 'Ramirez',
    'apellido', 'Ramirez',
    'telefono', '999333444',
    'email', 'luis.demo@kalu.local',
    'correo', 'luis.demo@kalu.local',
    'activo', true,
    'created_at', now()::text,
    'fecha_registro', current_date::text
  );
  perform pg_temp.kalu_insert_json('clientes', payload);
  cliente_luis := coalesce(pg_temp.kalu_find_pk_value('clientes', cliente_email_col, 'luis.demo@kalu.local'), cliente_ana);

  producto_name_col := pg_temp.kalu_first_column('productos', array['nombre', 'name', 'titulo']);

  payload := jsonb_build_object(
    'nombre', 'Torta Tres Leches Demo',
    'nombres', 'Torta Tres Leches Demo',
    'descripcion', 'Bizcocho artesanal con mezcla de tres leches.',
    'precio', 65,
    'precio_venta', 65,
    'costo', 32,
    'costo_unitario', 32,
    'stock', 8,
    'activo', true,
    'estado', 'activo',
    'categoria_id', categoria_id,
    'created_at', now()::text
  );
  perform pg_temp.kalu_insert_json('productos', payload);
  producto_torta := coalesce(pg_temp.kalu_find_pk_value('productos', producto_name_col, 'Torta Tres Leches Demo'), pg_temp.kalu_first_pk_value('productos'));

  payload := jsonb_build_object(
    'nombre', 'Brownie Artesanal Demo',
    'nombres', 'Brownie Artesanal Demo',
    'descripcion', 'Brownie húmedo de chocolate intenso.',
    'precio', 10,
    'precio_venta', 10,
    'costo', 4,
    'costo_unitario', 4,
    'stock', 20,
    'activo', true,
    'estado', 'activo',
    'categoria_id', categoria_id,
    'created_at', now()::text
  );
  perform pg_temp.kalu_insert_json('productos', payload);
  producto_brownie := coalesce(pg_temp.kalu_find_pk_value('productos', producto_name_col, 'Brownie Artesanal Demo'), producto_torta);

  insumo_name_col := pg_temp.kalu_first_column('insumos', array['nombre', 'name', 'descripcion']);

  payload := jsonb_build_object(
    'nombre', 'Chocolate bitter demo',
    'nombres', 'Chocolate bitter demo',
    'unidad', 'kg',
    'unidad_medida', 'kg',
    'medida', 'kg',
    'stock', 12,
    'stock_actual', 12,
    'stock_minimo', 3,
    'costo', 28,
    'costo_unitario', 28,
    'activo', true,
    'created_at', now()::text
  );
  perform pg_temp.kalu_insert_json('insumos', payload);
  insumo_chocolate := coalesce(pg_temp.kalu_find_pk_value('insumos', insumo_name_col, 'Chocolate bitter demo'), pg_temp.kalu_first_pk_value('insumos'));

  payload := jsonb_build_object(
    'nombre', 'Harina pastelera demo',
    'nombres', 'Harina pastelera demo',
    'unidad', 'kg',
    'unidad_medida', 'kg',
    'medida', 'kg',
    'stock', 25,
    'stock_actual', 25,
    'stock_minimo', 5,
    'costo', 7,
    'costo_unitario', 7,
    'activo', true,
    'created_at', now()::text
  );
  perform pg_temp.kalu_insert_json('insumos', payload);
  insumo_harina := coalesce(pg_temp.kalu_find_pk_value('insumos', insumo_name_col, 'Harina pastelera demo'), insumo_chocolate);

  pedido_1 := jsonb_build_object(
    'numero_pedido', 'KALU-DEMO-001',
    'codigo', 'KALU-DEMO-001',
    'codigo_pedido', 'KALU-DEMO-001',
    'cliente_id', cliente_ana,
    'estado_id', estado_pedido_id,
    'estado_pedido_id', estado_pedido_id,
    'fecha', current_date::text,
    'fecha_pedido', now()::text,
    'subtotal', 65,
    'total', 65,
    'monto_total', 65,
    'estado', 'Entregado',
    'canal', 'WhatsApp',
    'created_at', now()::text
  );
  perform pg_temp.kalu_insert_json('pedidos', pedido_1);
  pedido_1_id := coalesce(
    pg_temp.kalu_find_pk_value('pedidos', 'numero_pedido', 'KALU-DEMO-001'),
    pg_temp.kalu_first_pk_value('pedidos')
  );

  pedido_2 := jsonb_build_object(
    'numero_pedido', 'KALU-DEMO-002',
    'codigo', 'KALU-DEMO-002',
    'codigo_pedido', 'KALU-DEMO-002',
    'cliente_id', cliente_luis,
    'estado_id', estado_pedido_id,
    'estado_pedido_id', estado_pedido_id,
    'fecha', current_date::text,
    'fecha_pedido', now()::text,
    'subtotal', 20,
    'total', 20,
    'monto_total', 20,
    'estado', 'Confirmado',
    'canal', 'Mostrador',
    'created_at', now()::text
  );
  perform pg_temp.kalu_insert_json('pedidos', pedido_2);
  pedido_2_id := coalesce(
    pg_temp.kalu_find_pk_value('pedidos', 'numero_pedido', 'KALU-DEMO-002'),
    pg_temp.kalu_first_pk_value('pedidos')
  );

  perform pg_temp.kalu_insert_json('detalle_pedidos', jsonb_build_object(
    'id_pedido', pedido_1_id,
    'pedido_id', pedido_1_id,
    'id_producto', producto_torta,
    'producto_id', producto_torta,
    'cantidad', 1,
    'precio', 65,
    'precio_unitario', 65,
    'subtotal', 65,
    'total', 65,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('detalle_pedidos', jsonb_build_object(
    'id_pedido', pedido_2_id,
    'pedido_id', pedido_2_id,
    'id_producto', producto_brownie,
    'producto_id', producto_brownie,
    'cantidad', 2,
    'precio', 10,
    'precio_unitario', 10,
    'subtotal', 20,
    'total', 20,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('pagos', jsonb_build_object(
    'id_pedido', pedido_1_id,
    'pedido_id', pedido_1_id,
    'id_metodo_pago', metodo_pago_id,
    'metodo_pago_id', metodo_pago_id,
    'monto', 65,
    'total', 65,
    'estado', 'pagado',
    'fecha', current_date::text,
    'fecha_pago', now()::text,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('pagos', jsonb_build_object(
    'id_pedido', pedido_2_id,
    'pedido_id', pedido_2_id,
    'id_metodo_pago', metodo_pago_id,
    'metodo_pago_id', metodo_pago_id,
    'monto', 20,
    'total', 20,
    'estado', 'pendiente',
    'fecha', current_date::text,
    'fecha_pago', now()::text,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('ingresos', jsonb_build_object(
    'id_pedido', pedido_1_id,
    'pedido_id', pedido_1_id,
    'monto', 65,
    'total', 65,
    'concepto', 'Venta demo - Torta Tres Leches',
    'descripcion', 'Venta demo - Torta Tres Leches',
    'fecha', current_date::text,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('ingresos', jsonb_build_object(
    'id_pedido', pedido_2_id,
    'pedido_id', pedido_2_id,
    'monto', 20,
    'total', 20,
    'concepto', 'Venta demo - Brownies',
    'descripcion', 'Venta demo - Brownies',
    'fecha', current_date::text,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('movimientos_inventario', jsonb_build_object(
    'id_insumo', insumo_chocolate,
    'insumo_id', insumo_chocolate,
    'tipo', 'entrada',
    'tipo_movimiento', 'entrada',
    'cantidad', 12,
    'costo_unitario', 28,
    'descripcion', 'Stock inicial demo',
    'fecha', current_date::text,
    'created_at', now()::text
  ));

  perform pg_temp.kalu_insert_json('movimientos_inventario', jsonb_build_object(
    'id_insumo', insumo_harina,
    'insumo_id', insumo_harina,
    'tipo', 'entrada',
    'tipo_movimiento', 'entrada',
    'cantidad', 25,
    'costo_unitario', 7,
    'descripcion', 'Stock inicial demo',
    'fecha', current_date::text,
    'created_at', now()::text
  ));
end;
$$;

commit;

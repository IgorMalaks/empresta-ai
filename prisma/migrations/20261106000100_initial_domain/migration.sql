-- Initial migration for this ZIP only. Compare existing migration history before applying.
-- Connection/database and privileged service role are environment configuration, never literals.
-- Execute as the domain owner; the backend must use that owner or a dedicated BYPASSRLS role.
-- Never grant this function to browser roles: p_user is trusted ONLY after server-side Auth.
BEGIN;

CREATE FUNCTION public.loan_due_on(p_initial date)
RETURNS date
LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT day::date
  FROM (
    SELECT p_initial + n AS day,
           row_number() OVER (ORDER BY n) AS business_day
    FROM pg_catalog.generate_series(1, 20) AS n
    WHERE extract(isodow FROM p_initial + n) BETWEEN 1 AND 5
  ) AS days
  WHERE business_day = 14
$$;

CREATE TABLE public.equipments (
  id uuid NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
  patrimonio text NOT NULL,
  nome text NOT NULL,
  categoria text NOT NULL,
  situacao text NOT NULL DEFAULT 'disponivel',
  image_url text NOT NULL,
  pexels_id bigint NOT NULL,
  photographer text NOT NULL,
  source_url text NOT NULL,
  license_url text NOT NULL,
  image_sha256 text NOT NULL,
  CONSTRAINT equipments_pkey PRIMARY KEY (id),
  CONSTRAINT equipments_patrimonio_key UNIQUE (patrimonio),
  CONSTRAINT equipments_pexels_id_key UNIQUE (pexels_id),
  CONSTRAINT equipments_image_sha256_key UNIQUE (image_sha256),
  CONSTRAINT equipments_categoria_check CHECK (categoria IN ('notebook', 'monitor', 'cabo', 'camera')),
  CONSTRAINT equipments_situacao_check CHECK (situacao IN ('disponivel', 'manutencao', 'emprestado')),
  CONSTRAINT equipments_identity_check CHECK (btrim(patrimonio) <> '' AND btrim(nome) <> ''),
  CONSTRAINT equipments_photo_check CHECK (
    pexels_id > 0 AND image_sha256 ~ '^[0-9a-f]{64}$'
    AND btrim(photographer) <> '' AND image_url ~ '^https://'
    AND source_url ~ '^https://' AND license_url ~ '^https://'
  )
);

CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL,
  equipment_id uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  due_on date NOT NULL,
  returned_at timestamptz,
  CONSTRAINT loans_pkey PRIMARY KEY (id),
  CONSTRAINT loans_equipment_id_fkey FOREIGN KEY (equipment_id)
    REFERENCES public.equipments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT loans_due_on_check CHECK (
    pg_catalog.isfinite(requested_at) AND pg_catalog.isfinite(due_on)
    AND due_on = public.loan_due_on((requested_at AT TIME ZONE 'America/Sao_Paulo')::date)
  ),
  CONSTRAINT loans_returned_at_check CHECK (
    returned_at IS NULL OR (pg_catalog.isfinite(returned_at) AND returned_at >= requested_at)
  )
);
CREATE UNIQUE INDEX loans_one_open_per_equipment_idx ON public.loans(equipment_id)
  WHERE returned_at IS NULL;
CREATE INDEX loans_user_id_idx ON public.loans(user_id);

CREATE FUNCTION public.request_loan(p_user uuid, p_equipment uuid)
RETURNS TABLE(code text, loan_id uuid, due_on date)
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  v_situacao text;
  v_now timestamptz;
  v_today date;
  v_due date;
  v_id uuid;
BEGIN
  -- Fresh statement snapshots after lock waits are required for the per-user count.
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'request_loan requires READ COMMITTED isolation' USING ERRCODE = '25000';
  END IF;
  IF p_user IS NULL OR p_equipment IS NULL THEN
    RETURN QUERY SELECT 'INVALID_REQUEST'::text, NULL::uuid, NULL::date;
    RETURN;
  END IF;

  -- All requests acquire the user lock first, then exactly one equipment row.
  -- Hash collisions merely serialize unrelated users; they cannot weaken exclusion.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  SELECT e.situacao INTO v_situacao FROM public.equipments AS e
    WHERE e.id = p_equipment FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'EQUIPMENT_NOT_FOUND'::text, NULL::uuid, NULL::date;
    RETURN;
  END IF;

  v_now := pg_catalog.clock_timestamp();
  v_today := (v_now AT TIME ZONE 'America/Sao_Paulo')::date;
  IF EXISTS (SELECT 1 FROM public.loans AS l
    WHERE l.user_id = p_user AND l.returned_at IS NULL AND l.due_on < v_today) THEN
    RETURN QUERY SELECT 'OVERDUE'::text, NULL::uuid, NULL::date;
    RETURN;
  END IF;
  IF (SELECT count(*) FROM public.loans AS l WHERE l.user_id = p_user AND l.returned_at IS NULL) >= 5 THEN
    RETURN QUERY SELECT 'LIMIT_REACHED'::text, NULL::uuid, NULL::date;
    RETURN;
  END IF;
  IF v_situacao <> 'disponivel' OR EXISTS (
    SELECT 1 FROM public.loans AS l WHERE l.equipment_id = p_equipment AND l.returned_at IS NULL
  ) THEN
    RETURN QUERY SELECT 'EQUIPMENT_UNAVAILABLE'::text, NULL::uuid, NULL::date;
    RETURN;
  END IF;

  v_due := public.loan_due_on(v_today);
  INSERT INTO public.loans(user_id, equipment_id, requested_at, due_on)
    VALUES (p_user, p_equipment, v_now, v_due) RETURNING id INTO v_id;
  UPDATE public.equipments SET situacao = 'emprestado' WHERE id = p_equipment;
  RETURN QUERY SELECT 'SUCCESS'::text, v_id, v_due;
END
$$;

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.equipments, public.loans FROM PUBLIC;
REVOKE ALL ON FUNCTION public.loan_due_on(date), public.request_loan(uuid, uuid) FROM PUBLIC;
-- UUID defaults require no sequences; revoke only any sequences owned by these tables.
DO $$
DECLARE
  v_role text;
  v_sequence text;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['PUBLIC', 'anon', 'authenticated'] LOOP
    IF v_role = 'PUBLIC' OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = v_role) THEN
      IF v_role <> 'PUBLIC' THEN
        EXECUTE format('REVOKE ALL ON TABLE public.equipments, public.loans FROM %I', v_role);
        EXECUTE format('REVOKE ALL ON FUNCTION public.loan_due_on(date), public.request_loan(uuid, uuid) FROM %I', v_role);
      END IF;
      FOR v_sequence IN
        SELECT pg_catalog.pg_get_serial_sequence('public.' || t.tablename, c.attname)
        FROM pg_catalog.pg_tables t
        JOIN pg_catalog.pg_class r ON r.relname = t.tablename
        JOIN pg_catalog.pg_namespace n ON n.oid = r.relnamespace AND n.nspname = t.schemaname
        JOIN pg_catalog.pg_attribute c ON c.attrelid = r.oid AND c.attnum > 0
        WHERE t.schemaname = 'public' AND t.tablename IN ('equipments', 'loans')
      LOOP
        IF v_sequence IS NOT NULL THEN
          EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM %s', v_sequence,
            CASE WHEN v_role = 'PUBLIC' THEN 'PUBLIC' ELSE quote_ident(v_role) END);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$$;
COMMIT;

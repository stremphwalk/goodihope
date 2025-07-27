-- Cleaned AriNote Database Backup for Supabase
-- This version replaces COPY statements with INSERT statements for better compatibility

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.user_presets CASCADE;
DROP TABLE IF EXISTS public.template_usage CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.team_groups CASCADE;
DROP TABLE IF EXISTS public.ros_notes CASCADE;
DROP TABLE IF EXISTS public.group_todos CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.group_events CASCADE;
DROP TABLE IF EXISTS public.dot_phrases CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE;

-- Create drizzle schema
CREATE SCHEMA IF NOT EXISTS drizzle;

-- Create tables
CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    custom_identifier text,
    name text
);

CREATE TABLE public.dot_phrases (
    id integer NOT NULL,
    user_id integer NOT NULL,
    trigger text NOT NULL,
    content text NOT NULL,
    description text,
    category text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    share_code text,
    is_public boolean DEFAULT false,
    shared_at timestamp without time zone,
    import_count integer DEFAULT 0
);

CREATE TABLE public.ros_notes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    patient_name text,
    patient_dob text,
    patient_mrn text,
    selections jsonb,
    medications jsonb,
    generated_note text,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.template_usage (
    id integer NOT NULL,
    template_id integer NOT NULL,
    user_id integer NOT NULL,
    used_at timestamp without time zone DEFAULT now(),
    patient_context jsonb
);

CREATE TABLE public.templates (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    specialty text,
    content jsonb NOT NULL,
    is_public boolean DEFAULT false,
    version integer DEFAULT 1,
    parent_template_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    compatible_note_types jsonb,
    compatible_subtypes jsonb,
    section_defaults jsonb,
    last_used timestamp without time zone,
    is_favorite boolean DEFAULT false
);

CREATE TABLE public.user_presets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    is_favorite boolean DEFAULT false,
    symptoms jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.team_groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_by_user_id integer NOT NULL,
    invite_code text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL
);

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member',
    joined_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.group_todos (
    id integer NOT NULL,
    group_id integer NOT NULL,
    title text NOT NULL,
    description text,
    created_by_user_id integer NOT NULL,
    completed boolean DEFAULT false,
    completed_by_user_id integer,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    status text DEFAULT 'todo',
    assigned_to_user_id integer,
    "position" integer DEFAULT 0
);

CREATE TABLE public.group_events (
    id integer NOT NULL,
    group_id integer NOT NULL,
    title text NOT NULL,
    description text,
    event_date timestamp without time zone NOT NULL,
    created_by_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

-- Create sequences
CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.dot_phrases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.ros_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.template_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.user_presets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.team_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.group_todos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.group_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set sequence ownership
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER SEQUENCE public.dot_phrases_id_seq OWNED BY public.dot_phrases.id;
ALTER SEQUENCE public.ros_notes_id_seq OWNED BY public.ros_notes.id;
ALTER SEQUENCE public.template_usage_id_seq OWNED BY public.template_usage.id;
ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;
ALTER SEQUENCE public.user_presets_id_seq OWNED BY public.user_presets.id;
ALTER SEQUENCE public.team_groups_id_seq OWNED BY public.team_groups.id;
ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;
ALTER SEQUENCE public.group_todos_id_seq OWNED BY public.group_todos.id;
ALTER SEQUENCE public.group_events_id_seq OWNED BY public.group_events.id;

-- Set default values
ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
ALTER TABLE ONLY public.dot_phrases ALTER COLUMN id SET DEFAULT nextval('public.dot_phrases_id_seq'::regclass);
ALTER TABLE ONLY public.ros_notes ALTER COLUMN id SET DEFAULT nextval('public.ros_notes_id_seq'::regclass);
ALTER TABLE ONLY public.template_usage ALTER COLUMN id SET DEFAULT nextval('public.template_usage_id_seq'::regclass);
ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);
ALTER TABLE ONLY public.user_presets ALTER COLUMN id SET DEFAULT nextval('public.user_presets_id_seq'::regclass);
ALTER TABLE ONLY public.team_groups ALTER COLUMN id SET DEFAULT nextval('public.team_groups_id_seq'::regclass);
ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);
ALTER TABLE ONLY public.group_todos ALTER COLUMN id SET DEFAULT nextval('public.group_todos_id_seq'::regclass);
ALTER TABLE ONLY public.group_events ALTER COLUMN id SET DEFAULT nextval('public.group_events_id_seq'::regclass);

-- Insert data using INSERT statements instead of COPY
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (1, 'ad0acf3fc5715346ae0656f08f729144368452fc554d8113182853d347e4bbcf', 1750609505172);

INSERT INTO public.users (id, username, password, created_at, custom_identifier, name) VALUES 
(2, '41dba580-5031-70bb-0484-12fe5ff0fdbe', 'cognito-user', '2025-06-27 04:24:22.009163', NULL, NULL),
(1, '919b05e0-0031-701d-69b7-75fddec195ca', 'cognito-user', '2025-06-22 17:26:31.700543', 'BRFQ04', 'laurent.martel');

INSERT INTO public.dot_phrases (id, user_id, trigger, content, description, category, created_at, updated_at, share_code, is_public, shared_at, import_count) VALUES 
(5, 2, '/testing', '[[testinh|testimg]]testing\nsaving\n[[this|that]]\n[[DATE]]', NULL, 'general', '2025-06-27 04:24:46.774243', '2025-06-27 04:24:54.968', 'I1N4', true, '2025-06-27 04:24:54.968', 0),
(7, 1, '/test2', 'Template testing\nAdmission reason: Pneumonia\nMedications\n[[WIDGET:medication:widget-medication-1752035364690-04sdb8dmh]]\nPMH\n[[WIDGET:pmh:widget-pmh-1752035388292-9da277jzt]]\nImpressions\n[[WIDGET:impression:widget-impression-1752035438506-2nefl5j14]]\nPlan\nAdmit\n[[Tazo|Ceftri+ Azithro|Mero]]\n[[DATE]]', NULL, 'general', '2025-07-09 04:31:42.59187', '2025-07-09 04:31:42.59187', NULL, false, NULL, 0);

INSERT INTO public.team_groups (id, name, description, created_by_user_id, invite_code, created_at, expires_at) VALUES 
(1, 'TEST', NULL, 1, 'E0PSYR', '2025-07-22 04:33:35.434163', '2025-07-29 04:33:35.329'),
(2, 'Ward3A', NULL, 1, 'U10TC0', '2025-07-23 12:16:15.180422', '2025-07-30 12:16:15.147');

INSERT INTO public.group_members (id, group_id, user_id, role, joined_at) VALUES 
(2, 2, 1, 'creator', '2025-07-23 12:16:15.248823');

INSERT INTO public.group_todos (id, group_id, title, description, created_by_user_id, completed, completed_by_user_id, created_at, completed_at, status, assigned_to_user_id, "position") VALUES 
(2, 1, 'Consultation C43', 'Chest pain', 1, true, 1, '2025-07-22 04:42:56.042803', '2025-07-22 16:10:56.648', 'done', NULL, 0),
(3, 1, 'Consultation 6653', 'Hematuria', 1, true, 1, '2025-07-22 04:43:08.270196', '2025-07-22 04:43:22.224', 'done', NULL, 1),
(4, 1, 'Consultation B25', 'Chest pain', 1, true, 1, '2025-07-22 04:43:17.921515', '2025-07-22 04:59:15.892', 'done', NULL, 2),
(1, 1, 'Testing a new task', NULL, 1, false, NULL, '2025-07-22 04:34:43.762874', NULL, 'review', NULL, 0),
(13, 1, 'Test881', NULL, 1, false, NULL, '2025-07-22 22:57:22.802229', NULL, 'todo', NULL, 1),
(14, 1, 'Tesstin4', NULL, 1, false, NULL, '2025-07-23 00:02:31.920636', NULL, 'todo', NULL, 0),
(11, 1, 'New Task', NULL, 1, true, 1, '2025-07-22 22:06:03.024907', '2025-07-23 00:02:42.479', 'done', NULL, 0),
(12, 1, 'WILD', NULL, 1, true, 1, '2025-07-22 22:44:03.000192', '2025-07-23 00:02:45.61', 'done', NULL, 3);

INSERT INTO public.group_events (id, group_id, title, description, event_date, created_by_user_id, created_at) VALUES 
(1, 1, 'Exam', 'Absent 4-5 pm', '2025-07-24 13:00:00', 1, '2025-07-22 04:59:32.289147'),
(2, 1, 'Team meeting', NULL, '2025-07-23 12:00:00', 1, '2025-07-22 05:00:11.587802'),
(3, 1, 'Testing', NULL, '2025-07-23 23:00:00', 1, '2025-07-22 05:00:34.569261'),
(4, 1, 'Testing again', NULL, '2025-07-23 18:00:00', 1, '2025-07-22 05:00:51.337067'),
(5, 2, 'Axx', NULL, '2025-07-25 13:00:00', 1, '2025-07-23 16:46:34.848033'),
(6, 2, 'Test', NULL, '2025-07-25 20:52:00', 1, '2025-07-23 16:46:53.433864'),
(7, 2, '1234', NULL, '2025-07-28 13:00:00', 1, '2025-07-23 16:47:16.944254'),
(8, 2, '4567', NULL, '2025-07-28 20:53:00', 1, '2025-07-23 16:47:27.785026');

INSERT INTO public.templates (id, user_id, name, description, category, specialty, content, is_public, version, parent_template_id, created_at, updated_at, compatible_note_types, compatible_subtypes, section_defaults, last_used, is_favorite) VALUES 
(3, 1, 'Test2', NULL, 'admission', 'cardiology', '{"metadata": {"name": "Test2", "category": "admission", "specialty": "cardiology", "compatibleSubtypes": ["general"], "compatibleNoteTypes": ["admission"]}, "sections": [{"id": "note-type-1", "order": 1, "isEnabled": true, "sectionId": "note-type", "customContent": ""}, {"id": "hpi-1", "order": 2, "isEnabled": true, "sectionId": "hpi", "customContent": ""}, {"id": "impression-1", "order": 3, "isEnabled": true, "sectionId": "impression", "customContent": "Test\n- Test\nTest\ntest\n- test\n- test\n- test"}]}', false, 1, NULL, '2025-06-25 00:29:01.531384', '2025-06-25 00:29:01.531384', '["admission"]', '["general"]', '{"impression": "Test\n- Test\nTest\ntest\n- test\n- test\n- test"}', '2025-06-25 00:29:01.386', false),
(1, 1, 'Test template 1', NULL, 'admission', 'Cardiology', '{"metadata": {"name": "Test template 1", "category": "admission", "specialty": "Cardiology", "compatibleSubtypes": ["general"], "compatibleNoteTypes": ["admission"]}, "sections": [{"id": "note-type-1", "order": 1, "isEnabled": true, "sectionId": "note-type", "customContent": ""}, {"id": "hpi-1", "order": 2, "isEnabled": true, "sectionId": "hpi", "customContent": "Testing the content\nin this section\ntoi make sure \nit works \nwell"}, {"id": "impression-1", "order": 3, "isEnabled": true, "sectionId": "impression", "customContent": "Testing the saving capacitie sof the new template builder\n!!"}, {"id": "plan-1750722096781-7h0lftkxg", "order": 4, "isEnabled": true, "sectionId": "plan", "customContent": "Admit\nASA\nTesting"}]}', false, 1, NULL, '2025-06-23 14:22:26.928548', '2025-06-24 01:43:32.362', '["admission"]', '["general"]', '{"impression": "Testing the saving capacitie sof the new template builder\n!!"}', '2025-06-23 14:22:26.848', false),
(2, 1, 'ACS', NULL, 'consultation', 'cardiology', '{"metadata": {"name": "ACS", "category": "consultation", "specialty": "cardiology", "compatibleSubtypes": ["general"], "compatibleNoteTypes": ["consultation"]}, "sections": [{"id": "note-type-1", "order": 1, "isEnabled": true, "sectionId": "note-type", "customContent": ""}, {"id": "pmh-1750777631236-0u701deka", "order": 2, "isEnabled": true, "sectionId": "pmh", "customContent": ""}, {"id": "allergies-social-1750777632168-v729ahutl", "order": 3, "isEnabled": true, "sectionId": "allergies-social", "customContent": ""}, {"id": "meds-1750777631734-qk0j3hncm", "order": 4, "isEnabled": true, "sectionId": "meds", "customContent": ""}, {"id": "hpi-1", "order": 5, "isEnabled": true, "sectionId": "hpi", "customContent": ""}, {"id": "impression-1", "order": 6, "isEnabled": true, "sectionId": "impression", "customContent": "_ year old patient with past medical history significant for _, presents to the ER due to retrosternal chest pain.\n\n1) ACS 2nd to _\n- Hemodynamically stable\n- No signs of complications\n- Dynamic changes on EKG with troponin increase\n- Medical treatment started with ASA, ticagrelor and lovenox\n- DDx: "}, {"id": "plan-1750777665501-7m4ws491u", "order": 7, "isEnabled": true, "sectionId": "plan", "customContent": "Admit to CCU\nContinue ASA and Ticagrelor\nHigh intesnity statin\nACEI\nLow dose bisoprolol\nPlace on list for cath lab\nFollow up on BP and for signs of complication"}]}', false, 1, NULL, '2025-06-24 15:10:37.20765', '2025-06-24 15:10:37.20765', '["consultation"]', '["general"]', '{"plan": "Admit to CCU\nContinue ASA and Ticagrelor\nHigh intesnity statin\nACEI\nLow dose bisoprolol\nPlace on list for cath lab\nFollow up on BP and for signs of complication", "impression": "_ year old patient with past medical history significant for _, presents to the ER due to retrosternal chest pain.\n\n1) ACS 2nd to _\n- Hemodynamically stable\n- No signs of complications\n- Dynamic changes on EKG with troponin increase\n- Medical treatment started with ASA, ticagrelor and lovenox\n- DDx: "}', '2025-06-24 15:10:37.168', false);

INSERT INTO public.user_presets (id, user_id, title, is_favorite, symptoms, created_at, updated_at) VALUES 
(1, 1, 'General', false, '{"neurologic": [{"key": "headache"}, {"key": "syncope"}], "respiratory": [{"key": "dyspnea"}, {"key": "hemoptysis"}, {"key": "sputum_production"}], "genitourinary": [{"key": "dysuria"}], "cardiovascular": [{"key": "chest_pain"}, {"key": "orthopnea"}, {"key": "pnd"}], "gastrointestinal": [{"key": "nausea"}, {"key": "diarrhea"}, {"key": "constipation"}, {"key": "melena"}]}', '2025-07-19 21:17:33.291477', '2025-07-22 01:06:48.244'),
(2, 1, 'Test2', false, '{"neurologic": [{"key": "syncope"}, {"key": "seizures"}], "respiratory": [{"key": "hemoptysis"}, {"key": "pleuritic_chest_pain"}], "genitourinary": [{"key": "urgency"}], "cardiovascular": [{"key": "orthopnea"}], "gastrointestinal": [{"key": "constipation"}]}', '2025-07-19 21:21:04.816548', '2025-07-22 01:06:52.701');

-- Set sequence values
SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);
SELECT pg_catalog.setval('public.users_id_seq', 2, true);
SELECT pg_catalog.setval('public.dot_phrases_id_seq', 7, true);
SELECT pg_catalog.setval('public.ros_notes_id_seq', 1, false);
SELECT pg_catalog.setval('public.template_usage_id_seq', 1, false);
SELECT pg_catalog.setval('public.templates_id_seq', 3, true);
SELECT pg_catalog.setval('public.user_presets_id_seq', 2, true);
SELECT pg_catalog.setval('public.team_groups_id_seq', 2, true);
SELECT pg_catalog.setval('public.group_members_id_seq', 2, true);
SELECT pg_catalog.setval('public.group_todos_id_seq', 14, true);
SELECT pg_catalog.setval('public.group_events_id_seq', 8, true);

-- Create constraints
ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_custom_identifier_key UNIQUE (custom_identifier);

ALTER TABLE ONLY public.dot_phrases
    ADD CONSTRAINT dot_phrases_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.dot_phrases
    ADD CONSTRAINT dot_phrases_share_code_unique UNIQUE (share_code);

ALTER TABLE ONLY public.ros_notes
    ADD CONSTRAINT ros_notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.template_usage
    ADD CONSTRAINT template_usage_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_presets
    ADD CONSTRAINT user_presets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.team_groups
    ADD CONSTRAINT team_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.team_groups
    ADD CONSTRAINT team_groups_invite_code_key UNIQUE (invite_code);

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);

ALTER TABLE ONLY public.group_todos
    ADD CONSTRAINT group_todos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_events
    ADD CONSTRAINT group_events_pkey PRIMARY KEY (id);

-- Create indexes
CREATE INDEX idx_users_custom_identifier ON public.users USING btree (custom_identifier);
CREATE INDEX idx_user_presets_user_id ON public.user_presets USING btree (user_id);
CREATE INDEX idx_user_presets_updated_at ON public.user_presets USING btree (updated_at);
CREATE INDEX idx_team_groups_invite_code ON public.team_groups USING btree (invite_code);
CREATE INDEX idx_team_groups_expires_at ON public.team_groups USING btree (expires_at);
CREATE INDEX idx_group_todos_user_refs ON public.group_todos USING btree (created_by_user_id, completed_by_user_id, assigned_to_user_id);
CREATE INDEX idx_group_todos_status_assignments ON public.group_todos USING btree (group_id, status, assigned_to_user_id, "position");
CREATE INDEX idx_group_todos_group_status_position ON public.group_todos USING btree (group_id, status, "position");
CREATE INDEX idx_group_todos_group_id ON public.group_todos USING btree (group_id);
CREATE INDEX idx_group_todos_completed ON public.group_todos USING btree (completed);
CREATE INDEX idx_group_members_user_id ON public.group_members USING btree (user_id);
CREATE INDEX idx_group_members_group_user ON public.group_members USING btree (group_id, user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members USING btree (group_id);
CREATE INDEX idx_group_events_group_id ON public.group_events USING btree (group_id);
CREATE INDEX idx_group_events_group_date ON public.group_events USING btree (group_id, event_date);
CREATE INDEX idx_group_events_event_date ON public.group_events USING btree (event_date);

-- Create foreign key constraints
ALTER TABLE ONLY public.dot_phrases
    ADD CONSTRAINT dot_phrases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.ros_notes
    ADD CONSTRAINT ros_notes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.template_usage
    ADD CONSTRAINT template_usage_template_id_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.templates(id);

ALTER TABLE ONLY public.template_usage
    ADD CONSTRAINT template_usage_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.user_presets
    ADD CONSTRAINT user_presets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.team_groups
    ADD CONSTRAINT team_groups_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.team_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_todos
    ADD CONSTRAINT group_todos_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.team_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_todos
    ADD CONSTRAINT group_todos_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.group_todos
    ADD CONSTRAINT group_todos_completed_by_user_id_fkey FOREIGN KEY (completed_by_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.group_todos
    ADD CONSTRAINT group_todos_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.group_events
    ADD CONSTRAINT group_events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.team_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_events
    ADD CONSTRAINT group_events_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id); 
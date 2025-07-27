--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE drizzle.__drizzle_migrations DISABLE TRIGGER ALL;

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	ad0acf3fc5715346ae0656f08f729144368452fc554d8113182853d347e4bbcf	1750609505172
\.


ALTER TABLE drizzle.__drizzle_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, username, password, created_at, custom_identifier, name) FROM stdin;
2	41dba580-5031-70bb-0484-12fe5ff0fdbe	cognito-user	2025-06-27 04:24:22.009163	\N	\N
1	919b05e0-0031-701d-69b7-75fddec195ca	cognito-user	2025-06-22 17:26:31.700543	BRFQ04	laurent.martel
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: dot_phrases; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.dot_phrases DISABLE TRIGGER ALL;

COPY public.dot_phrases (id, user_id, trigger, content, description, category, created_at, updated_at, share_code, is_public, shared_at, import_count) FROM stdin;
5	2	/testing	[[testinh|testimg]]testing\nsaving\n[[this|that]]\n[[DATE]]	\N	general	2025-06-27 04:24:46.774243	2025-06-27 04:24:54.968	I1N4	t	2025-06-27 04:24:54.968	0
7	1	/test2	Template testing\nAdmission reason: Pneumonia\nMedications\n[[WIDGET:medication:widget-medication-1752035364690-04sdb8dmh]]\nPMH\n[[WIDGET:pmh:widget-pmh-1752035388292-9da277jzt]]\nImpressions\n[[WIDGET:impression:widget-impression-1752035438506-2nefl5j14]]\nPlan\nAdmit\n[[Tazo|Ceftri+ Azithro|Mero]]\n[[DATE]]	\N	general	2025-07-09 04:31:42.59187	2025-07-09 04:31:42.59187	\N	f	\N	0
\.


ALTER TABLE public.dot_phrases ENABLE TRIGGER ALL;

--
-- Data for Name: team_groups; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.team_groups DISABLE TRIGGER ALL;

COPY public.team_groups (id, name, description, created_by_user_id, invite_code, created_at, expires_at) FROM stdin;
1	TEST	\N	1	E0PSYR	2025-07-22 04:33:35.434163	2025-07-29 04:33:35.329
2	Ward3A	\N	1	U10TC0	2025-07-23 12:16:15.180422	2025-07-30 12:16:15.147
\.


ALTER TABLE public.team_groups ENABLE TRIGGER ALL;

--
-- Data for Name: group_events; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.group_events DISABLE TRIGGER ALL;

COPY public.group_events (id, group_id, title, description, event_date, created_by_user_id, created_at) FROM stdin;
1	1	Exam	Absent 4-5 pm	2025-07-24 13:00:00	1	2025-07-22 04:59:32.289147
2	1	Team meeting	\N	2025-07-23 12:00:00	1	2025-07-22 05:00:11.587802
3	1	Testing	\N	2025-07-23 23:00:00	1	2025-07-22 05:00:34.569261
4	1	Testing again	\N	2025-07-23 18:00:00	1	2025-07-22 05:00:51.337067
5	2	Axx	\N	2025-07-25 13:00:00	1	2025-07-23 16:46:34.848033
6	2	Test	\N	2025-07-25 20:52:00	1	2025-07-23 16:46:53.433864
7	2	1234	\N	2025-07-28 13:00:00	1	2025-07-23 16:47:16.944254
8	2	4567	\N	2025-07-28 20:53:00	1	2025-07-23 16:47:27.785026
\.


ALTER TABLE public.group_events ENABLE TRIGGER ALL;

--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.group_members DISABLE TRIGGER ALL;

COPY public.group_members (id, group_id, user_id, role, joined_at) FROM stdin;
2	2	1	creator	2025-07-23 12:16:15.248823
\.


ALTER TABLE public.group_members ENABLE TRIGGER ALL;

--
-- Data for Name: group_todos; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.group_todos DISABLE TRIGGER ALL;

COPY public.group_todos (id, group_id, title, description, created_by_user_id, completed, completed_by_user_id, created_at, completed_at, status, assigned_to_user_id, "position") FROM stdin;
2	1	Consultation C43	Chest pain	1	t	1	2025-07-22 04:42:56.042803	2025-07-22 16:10:56.648	done	\N	0
3	1	Consultation 6653	Hematuria	1	t	1	2025-07-22 04:43:08.270196	2025-07-22 04:43:22.224	done	\N	1
4	1	Consultation B25	Chest pain	1	t	1	2025-07-22 04:43:17.921515	2025-07-22 04:59:15.892	done	\N	2
1	1	Testing a new task	\N	1	f	\N	2025-07-22 04:34:43.762874	\N	review	\N	0
13	1	Test881	\N	1	f	\N	2025-07-22 22:57:22.802229	\N	todo	\N	1
14	1	Tesstin4	\N	1	f	\N	2025-07-23 00:02:31.920636	\N	todo	\N	0
11	1	New Task	\N	1	t	1	2025-07-22 22:06:03.024907	2025-07-23 00:02:42.479	done	\N	0
12	1	WILD	\N	1	t	1	2025-07-22 22:44:03.000192	2025-07-23 00:02:45.61	done	\N	3
\.


ALTER TABLE public.group_todos ENABLE TRIGGER ALL;

--
-- Data for Name: ros_notes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.ros_notes DISABLE TRIGGER ALL;

COPY public.ros_notes (id, user_id, patient_name, patient_dob, patient_mrn, selections, medications, generated_note, created_at) FROM stdin;
\.


ALTER TABLE public.ros_notes ENABLE TRIGGER ALL;

--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.templates DISABLE TRIGGER ALL;

COPY public.templates (id, user_id, name, description, category, specialty, content, is_public, version, parent_template_id, created_at, updated_at, compatible_note_types, compatible_subtypes, section_defaults, last_used, is_favorite) FROM stdin;
3	1	Test2	\N	admission	cardiology	{"metadata": {"name": "Test2", "category": "admission", "specialty": "cardiology", "compatibleSubtypes": ["general"], "compatibleNoteTypes": ["admission"]}, "sections": [{"id": "note-type-1", "order": 1, "isEnabled": true, "sectionId": "note-type", "customContent": ""}, {"id": "hpi-1", "order": 2, "isEnabled": true, "sectionId": "hpi", "customContent": ""}, {"id": "impression-1", "order": 3, "isEnabled": true, "sectionId": "impression", "customContent": "Test\\n- Test\\nTest\\ntest\\n- test\\n- test\\n- test"}]}	f	1	\N	2025-06-25 00:29:01.531384	2025-06-25 00:29:01.531384	["admission"]	["general"]	{"impression": "Test\\n- Test\\nTest\\ntest\\n- test\\n- test\\n- test"}	2025-06-25 00:29:01.386	f
1	1	Test template 1	\N	admission	Cardiology	{"metadata": {"name": "Test template 1", "category": "admission", "specialty": "Cardiology", "compatibleSubtypes": ["general"], "compatibleNoteTypes": ["admission"]}, "sections": [{"id": "note-type-1", "order": 1, "isEnabled": true, "sectionId": "note-type", "customContent": ""}, {"id": "hpi-1", "order": 2, "isEnabled": true, "sectionId": "hpi", "customContent": "Testing the content\\nin this section\\ntoi make sure \\nit works \\nwell"}, {"id": "impression-1", "order": 3, "isEnabled": true, "sectionId": "impression", "customContent": "Testing the saving capacitie sof the new template builder\\n!!"}, {"id": "plan-1750722096781-7h0lftkxg", "order": 4, "isEnabled": true, "sectionId": "plan", "customContent": "Admit\\nASA\\nTesting"}]}	f	1	\N	2025-06-23 14:22:26.928548	2025-06-24 01:43:32.362	["admission"]	["general"]	{"impression": "Testing the saving capacitie sof the new template builder\\n!!"}	2025-06-23 14:22:26.848	f
2	1	ACS	\N	consultation	cardiology	{"metadata": {"name": "ACS", "category": "consultation", "specialty": "cardiology", "compatibleSubtypes": ["general"], "compatibleNoteTypes": ["consultation"]}, "sections": [{"id": "note-type-1", "order": 1, "isEnabled": true, "sectionId": "note-type", "customContent": ""}, {"id": "pmh-1750777631236-0u701deka", "order": 2, "isEnabled": true, "sectionId": "pmh", "customContent": ""}, {"id": "allergies-social-1750777632168-v729ahutl", "order": 3, "isEnabled": true, "sectionId": "allergies-social", "customContent": ""}, {"id": "meds-1750777631734-qk0j3hncm", "order": 4, "isEnabled": true, "sectionId": "meds", "customContent": ""}, {"id": "hpi-1", "order": 5, "isEnabled": true, "sectionId": "hpi", "customContent": ""}, {"id": "impression-1", "order": 6, "isEnabled": true, "sectionId": "impression", "customContent": "_ year old patient with past medical history significant for _, presents to the ER due to retrosternal chest pain.\\n\\n1) ACS 2nd to _\\n- Hemodynamically stable\\n- No signs of complications\\n- Dynamic changes on EKG with troponin increase\\n- Medical treatment started with ASA, ticagrelor and lovenox\\n- DDx: "}, {"id": "plan-1750777665501-7m4ws491u", "order": 7, "isEnabled": true, "sectionId": "plan", "customContent": "Admit to CCU\\nContinue ASA and Ticagrelor\\nHigh intesnity statin\\nACEI\\nLow dose bisoprolol\\nPlace on list for cath lab\\nFollow up on BP and for signs of complication"}]}	f	1	\N	2025-06-24 15:10:37.20765	2025-06-24 15:10:37.20765	["consultation"]	["general"]	{"plan": "Admit to CCU\\nContinue ASA and Ticagrelor\\nHigh intesnity statin\\nACEI\\nLow dose bisoprolol\\nPlace on list for cath lab\\nFollow up on BP and for signs of complication", "impression": "_ year old patient with past medical history significant for _, presents to the ER due to retrosternal chest pain.\\n\\n1) ACS 2nd to _\\n- Hemodynamically stable\\n- No signs of complications\\n- Dynamic changes on EKG with troponin increase\\n- Medical treatment started with ASA, ticagrelor and lovenox\\n- DDx: "}	2025-06-24 15:10:37.168	f
\.


ALTER TABLE public.templates ENABLE TRIGGER ALL;

--
-- Data for Name: template_usage; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.template_usage DISABLE TRIGGER ALL;

COPY public.template_usage (id, template_id, user_id, used_at, patient_context) FROM stdin;
\.


ALTER TABLE public.template_usage ENABLE TRIGGER ALL;

--
-- Data for Name: user_presets; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.user_presets DISABLE TRIGGER ALL;

COPY public.user_presets (id, user_id, title, is_favorite, symptoms, created_at, updated_at) FROM stdin;
1	1	General	f	{"neurologic": [{"key": "headache"}, {"key": "syncope"}], "respiratory": [{"key": "dyspnea"}, {"key": "hemoptysis"}, {"key": "sputum_production"}], "genitourinary": [{"key": "dysuria"}], "cardiovascular": [{"key": "chest_pain"}, {"key": "orthopnea"}, {"key": "pnd"}], "gastrointestinal": [{"key": "nausea"}, {"key": "diarrhea"}, {"key": "constipation"}, {"key": "melena"}]}	2025-07-19 21:17:33.291477	2025-07-22 01:06:48.244
2	1	Test2	f	{"neurologic": [{"key": "syncope"}, {"key": "seizures"}], "respiratory": [{"key": "hemoptysis"}, {"key": "pleuritic_chest_pain"}], "genitourinary": [{"key": "urgency"}], "cardiovascular": [{"key": "orthopnea"}], "gastrointestinal": [{"key": "constipation"}]}	2025-07-19 21:21:04.816548	2025-07-22 01:06:52.701
\.


ALTER TABLE public.user_presets ENABLE TRIGGER ALL;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: dot_phrases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dot_phrases_id_seq', 7, true);


--
-- Name: group_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_events_id_seq', 8, true);


--
-- Name: group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_members_id_seq', 2, true);


--
-- Name: group_todos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_todos_id_seq', 14, true);


--
-- Name: ros_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ros_notes_id_seq', 1, false);


--
-- Name: team_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_groups_id_seq', 2, true);


--
-- Name: template_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.template_usage_id_seq', 1, false);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.templates_id_seq', 3, true);


--
-- Name: user_presets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_presets_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--


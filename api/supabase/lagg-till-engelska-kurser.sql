-- Nordic Agir Academy v8.8 — engelska kurser (2026-09-28)
-- Kör i Supabase: SQL Editor -> New query -> klistra in -> Run.
-- Säker att köra flera gånger: finns raden redan uppdateras titel och kurslänk.

insert into courses (id, title, courseau_url) values
  ('bas-en', 'BAS-P and BAS-U — Swedish Construction Coordination (in English)', 'https://app.courseau.co/projects/dd7d378a-1766-4390-b290-b3daeee957a3/preview?scorm=true&token=sct_BibZI5FghwyadJ9m6epl70uQf3RO6-Xc2Wwm6m4p41M'),
  ('apv-en', 'Safe roadwork site – Basic competence APV Step 1', 'https://app.courseau.co/projects/4b8d4f80-1dd7-4d59-81ee-689d544517a6/preview?scorm=true&token=sct_DvPhQdsWYY2GsPmvhQJ36P4UhNOgIXd8t5kksOk4fcQ'),
  ('lyft-en', 'Safe Lifting: Risk Assessment and Equipment', 'https://app.courseau.co/projects/98917904-74d9-47ca-87f5-c80daa4387e2/preview?scorm=true&token=sct_SjLB9vrLK5YNHQQpWXGF4bR64pF7fgeicvv1wLcr1-U'),
  ('kma-en', 'QEHS in Practice – Construction and Civil Engineering', 'https://app.courseau.co/projects/1ce2aab6-ed76-4803-836b-5265bc91f590/preview?scorm=true&token=sct_6sSrUgC3x1W9IxvynKcJV35idIfFr8LIS3AEGtc94GM'),
  ('ata-en', 'ÄTA management: From theory to practice', 'https://app.courseau.co/projects/9b7787a3-036c-4511-8c09-41c62bc4e0a5/preview?scorm=true&token=sct_ARdz2HpJxh5vb8A1ZGNqWqwNnWCGDNiOgVUhPA_UW-g'),
  ('ab-abt-en', 'AB04 and ABT06 – The Standard Contracts in Construction', 'https://app.courseau.co/projects/9619562f-359b-4300-94c1-72ff80978959/preview?scorm=true&token=sct_RRTnu_4yxeOG5z5qmij6vOCChc_sGAlLZvU3okN5hpg'),
  ('ejur-en', 'Construction Contract Law: AB 04, ABT 06, and ABK 09', 'https://app.courseau.co/projects/e9aed45a-b657-4b6a-955b-08df34d9226c/preview?scorm=true&token=sct_UFUR_wWnzvqbUe5r6qg6WE_pbvKD2t2a1pTP6LglrvI'),
  ('abk-en', 'ABK 09: Contracts and Liability in Consulting Engagements', 'https://app.courseau.co/projects/d3b39254-4640-476a-8388-265efe50b6da/preview?scorm=true&token=sct_y4-DLKPIhJ7J2pV16vfvFgISEvt97FyfqOO8WrZ3ZrQ'),
  ('kalk-en', 'Estimating for construction contracts – from bid to profit', 'https://app.courseau.co/projects/45bd240f-1dd4-490a-97d5-a5fbc8873c46/preview?scorm=true&token=sct_KptWmt9GeE6AfyUrKirc8dJkXhzHf-xcLh7-4BBiTQw'),
  ('tid-en', 'Scheduling in Construction Projects – From Plan to Production', 'https://app.courseau.co/projects/120000d6-ce6e-4373-8ba4-5fe59476b41d/preview?scorm=true&token=sct_84r_DfOr2fT4Nd92lWtRyiAouVcbiBqonxsZyJIcivE'),
  ('byggpl-en', 'Construction Project Management: Your Role as a Project Manager', 'https://app.courseau.co/projects/c086f636-e79c-48b4-9a85-a8d1a6f16b92/preview?scorm=true&token=sct_TyFdZ85Am4Nak5nJYicJxvH-Y8yp6rAJFbSWdMlf-fw'),
  ('ama-anl-en', 'AMA Anläggning in practice – quality on the job site', 'https://app.courseau.co/projects/10425075-3ae9-4e88-9cea-917b915a4f34/preview?scorm=true&token=sct_v7Oq9GM4K4pHIp7J4vJEappF3KmbS_xxExLhxid3voY'),
  ('ama-hus-en', 'AMA Hus in practice – from code to quality', 'https://app.courseau.co/projects/79f9ea32-4993-4e95-8ff4-609e28e20777/preview?scorm=true&token=sct_5ItqS-HnyPtG9i2AJmitq9f1tIpj9z6x1SDcNh_z7jA'),
  ('ama-af-en', 'AMA AF: Administrative Provisions in Practice', 'https://app.courseau.co/projects/5e998e7b-264c-46a8-8ff6-4480f6cbc7e2/preview?scorm=true&token=sct_oF4NHmgdkuHPm2DyA6FOgyIIyugax5ux2mMr4mJUnik'),
  ('anbud-en', 'Analyzing and Quality-Assuring Public Bids', 'https://app.courseau.co/projects/34892865-89f5-4e8b-b198-4c208316e90f/preview?scorm=true&token=sct_uv9S1LClbI7vWXXB1MvSqf8bg-H-2nrwNWrApM4z0KE'),
  ('lou-praktik-en', 'LOU in practice – public procurement', 'https://app.courseau.co/projects/415381b9-a43a-464f-bf75-73f0ec16a079/preview?scorm=true&token=sct_f4M5Arf7w2Y6O4Cs9CRy_8XWVx4X6k1L_dBnaM2x3uA'),
  ('ramavtal-en', 'Framework agreements and call-offs: strategy for suppliers', 'https://app.courseau.co/projects/45e5a61b-4d0f-4e3d-8210-f9bb718ed69a/preview?scorm=true&token=sct_g6KiYmMxQLiziZghEfkaMtLGoQoEQQv-F2DZTwOooDo')
on conflict (id) do update set title = excluded.title, courseau_url = excluded.courseau_url;

-- Kontroll: ska visa 17 rader
select id, title, courseau_url is not null as har_lank from courses where id like '%-en' order by id;

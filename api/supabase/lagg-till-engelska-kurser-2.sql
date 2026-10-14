-- Nordic Agir Academy v8.11 — åtta nya engelska kurser
-- Kör i Supabase: SQL Editor -> New query -> klistra in -> Run.
-- Säker att köra flera gånger: finns raden redan uppdateras titel och kurslänk.

insert into courses (id, title, courseau_url) values
  ('fall-en', 'Fall Protection: Working Safely at Height', 'https://app.courseau.co/projects/b04ae46c-6989-4fae-868e-17dcc2734e0e/preview?scorm=true&token=sct_YA7uFCE4KbqEHh2Vv4LNf12iEw9xBqoNxPGQ6rCrgTA'),
  ('schakt-en', 'Safe excavation: plan, assess, and act correctly', 'https://app.courseau.co/projects/6934c13e-82f0-40eb-8a02-b09ef3d2c899/preview?scorm=true&token=sct_9xYnI_fMXUH9sf_OHOLaRF65BjOKt0HyfVTt37JQU0U'),
  ('ritning-en', 'Drawing Reading for Site Managers in the Construction Industry', 'https://app.courseau.co/projects/c026ff05-0b53-4b06-9c82-1e154c0fce97/preview?scorm=true&token=sct_offs-OIRTQ7uMPGxwhG8Rlk-xOiZWbIRUI4Y8HDWL-Y'),
  ('mer-en', 'MER Anläggning: how to read your bill of quantities', 'https://app.courseau.co/projects/077764d6-d0f8-4528-8664-3c3506baf032/preview?scorm=true&token=sct_ioBS7Utm_aeYqnievpxIlGfbXG2KCBFF9ljD7vjEOWw'),
  ('inst-en', 'The MEP Coordinator: from clash to control', 'https://app.courseau.co/projects/0db340ce-4342-4d6d-a01b-5ee0d661dc52/preview?scorm=true&token=sct_J_v_MRozi4n1MDNyYkpsCUd9UEWhEniNXgoLwXuozSA'),
  ('pl-en', 'Project Management in Construction and Civil Engineering Projects', 'https://app.courseau.co/projects/2130869e-a082-4832-89fc-5235454023a9/preview?scorm=true&token=sct_CaKW9jKIUjEFpFWCSB_KF_KwfAHlAXtGy0w0btNBkIk'),
  ('bim-en', 'BIM in production: read, review, and use the model', 'https://app.courseau.co/projects/599dfdba-2597-40d7-9165-2c1be6af54e9/preview?scorm=true&token=sct_Qbsy8ez6NSrjZR_MITPmupXMW55k8bXcP5zQZ723h8g'),
  ('prl-en', 'Design Management in Building and Civil Engineering Projects', 'https://app.courseau.co/projects/22fb1d16-f2b4-4230-8666-9c0945a92a70/preview?scorm=true&token=sct_Aui1lSVw6mQOkPvn_Uaale0KlkI60G-lUcSSsIG-Soc')
on conflict (id) do update set title = excluded.title, courseau_url = excluded.courseau_url;

-- Kontroll: ska visa 25 rader
select id, title, courseau_url is not null as har_lank from courses where id like '%-en' order by id;

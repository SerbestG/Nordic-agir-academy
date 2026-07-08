-- supabase/schema.sql
-- Kör detta i Supabase: SQL Editor → New query → klistra in → Run.

-- 1) Kurser: här lägger ni in Courseau-länken per kurs.
--    Hämta länken i Courseau: öppna kursen → Share → kopiera embed-/direktlänken.
create table if not exists courses (
  id text primary key,          -- samma id som på hemsidan, t.ex. 'ata', 'bas', 'lou-grund'
  title text not null,
  courseau_url text             -- t.ex. https://app.courseau.co/projects/xxxx/preview
);

insert into courses (id, title) values
  ('lou-grund','Grunderna i offentlig upphandling och LOU'),
  ('lou-praktik','LOU i praktiken'),
  ('luf-praktik','LUF i praktiken'),
  ('ejur','Entreprenadjuridik — AB 04, ABT 06 och ABK 09'),
  ('ab-abt','AB 04 och ABT 06'),
  ('abk','ABK 09'),
  ('ata','ÄTA-hantering'),
  ('lyft','Säkra lyft'),
  ('bas','BAS-P och BAS-U'),
  ('apv','APV steg 1'),
  ('ama-hus','AMA Hus'),
  ('ama-anl','AMA Anläggning'),
  ('kma','KMA'),
  ('pl','Projektledning'),
  ('prl','Projekteringsledning'),
  ('tid','Tidsplanering i byggprojekt'),
  ('kalk','Kalkylering för entreprenader')
on conflict (id) do nothing;

-- Kurslänkar från Courseau: exportera kursen som SCORM i Courseau, öppna index.html
-- i paketet och kopiera iframe-adressen (app.courseau.co/projects/…?scorm=true&token=…).
-- Lägg in den så här (ÄTA är redan gjord som exempel):
update courses set courseau_url =
  'https://app.courseau.co/projects/5ef7b500-19c2-4a26-9d02-92fce9c95e71/preview?scorm=true&token=sct_0czQRhTofJwNLLaYWS1NK46SlaSWPDjw40wM4XLznE0'
  where id = 'ata';

-- 2) Deltagarregistreringar: en rad per deltagare och kurs.
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  order_ref text,               -- Stripe-session eller NA-ordernummer
  buyer_name text,
  buyer_company text,
  buyer_email text,
  course_id text references courses(id),
  name text not null,
  email text not null,
  status text not null default 'ej',   -- 'ej' | 'pagar' | 'klar'
  cert_id text,
  cert_date date
);

-- 3) Admins: e-postadresser som får se och ändra allt i adminportalen.
create table if not exists admins (
  email text primary key
);
-- Lägg till er själva (skapa även användaren under Authentication → Users):
-- insert into admins (email) values ('info@nordicagir.se');

-- 4) Säkerhetsregler (RLS)
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table admins enable row level security;

-- Inloggade får läsa kurslistan
create policy "kurser läsbara för inloggade" on courses
  for select to authenticated using (true);

-- Deltagare ser sina egna registreringar
create policy "egna registreringar" on enrollments
  for select to authenticated
  using (email = auth.jwt()->>'email'
         or exists (select 1 from admins a where a.email = auth.jwt()->>'email'));

-- Deltagare får uppdatera status på sina egna rader (påbörja/slutföra kurs)
create policy "uppdatera egen status" on enrollments
  for update to authenticated
  using (email = auth.jwt()->>'email')
  with check (email = auth.jwt()->>'email' and status in ('ej','pagar','klar'));

-- Admins får uppdatera allt (status, certifikat)
create policy "admin uppdaterar allt" on enrollments
  for update to authenticated
  using (exists (select 1 from admins a where a.email = auth.jwt()->>'email'))
  with check (true);

-- Admins ser adminslistan (för behörighetskollen vid inloggning)
create policy "läs egen adminrad" on admins
  for select to authenticated using (email = auth.jwt()->>'email');

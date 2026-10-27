# LaFix 2.0 — MVP independent de Polsia

Monorepo cu `apps/web` (Next.js 15, React 19, Prisma/PostgreSQL) și `apps/mobile` (Expo 54, React Native).

## Securitatea conturilor și solicitări fără cont

Verificare email, recuperare parolă, TOTP/2FA și coduri de recuperare: [docs/ACCOUNT_SECURITY.md](docs/ACCOUNT_SECURITY.md). Trimiterea efectivă a emailurilor necesită un expeditor și credențiale configurate privat. Backupul gestionat necesită activarea unui plan compatibil; nu este activ pe Free.

Pop-up-ul permite solicitări fără cont printr-un flux separat, cu verificarea acordului și ticket de unică utilizare. Formularul din pagină rămâne autentificat: [docs/POPUP_GUEST.md](docs/POPUP_GUEST.md).

## Configurare online de test

Configurația Render este pregătită în `render.yaml`, cu acces prin parolă, bază `lafix_staging`, secrete generate de furnizor și plăți dezactivate. Niciun serviciu nu a fost creat. Pași și limite: [docs/STAGING.md](docs/STAGING.md). PostgreSQL Free expiră după 30 de zile; nu este găzduire permanentă.

## Administrare și acces — actualizare 27 octombrie 2026

Panou cu șapte secțiuni de urmărire, filtre, indicatori și audit; autentificare ADMIN separată la `/admin/login`, cu previzualizare fictivă la `/demo/admin`. Pagina prestatorilor este integrată în navigarea și stilul original al primei pagini. Configurare, verificări și limite: [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md).

Verificare curentă: build și TypeScript trecute, 13 teste unitare/HTTP trecute. Testele cu PostgreSQL și autentificarea cu conturi rămân în așteptare; previzualizarea nu validează aceste fluxuri.

## Oportunități & Pro — actualizare 27 octombrie 2026

Pagina `/prestatori` prezintă Starter și Pro, inclusiv un exemplu fictiv de deblocare. Portofelul, calificarea administrativă, accesul la contact, șabloanele Pro și rambursările au implementări API și migrare; testarea lor cu PostgreSQL rămâne în așteptare. Plățile reale sunt dezactivate. Configurare și limite: [docs/MONETIZATION.md](docs/MONETIZATION.md).

## Verificare actuală

Continuarea din 23 octombrie 2026 este documentată în [docs/STATUS_V06.md](docs/STATUS_V06.md). Build-ul Next.js, typecheck, patru teste unitare/HTTP și exporturile JavaScript iOS/Android au trecut. Migrarea PostgreSQL, fluxul complet și testele browser rămân neverificate din cauza restricțiilor sandboxului. Proiectul nu este pregătit pentru producție. Pentru instalări noi utilizați `npm ci` și `npm run db:migrate`; nu folosiți `db:push` pentru producție.

## Implementat în acest pachet

- Site responsive în română și formular public de cerere.
- Înregistrare client / prestator cu parole hash bcrypt, autentificare JWT (cookie httpOnly pentru web; Bearer token pentru mobil).
- Profil de prestator cu status `PENDING`, aprobare / suspendare prin interfața admin (rol ADMIN).
- Administrator autentificat: listare cereri și prestatori, aprobare, matching manual, maximum trei prestatori/caz.
- Prestator aprobat: vizualizare cereri alocate și transmitere ofertă.
- Client autentificat: cereri legate de cont, vizualizare oferte și acceptarea unei singure oferte.
- Aplicație mobilă: înregistrare/autentificare, cereri, lead-uri, ofertare/acceptare prin același API.

## Pornire locală

Necesită Node.js 22+, npm și PostgreSQL.

```bash
npm install
cp apps/web/.env.example apps/web/.env
# Editați DATABASE_URL, AUTH_SECRET (>=32 caractere), APP_ORIGIN
npm run db:generate
npm run db:migrate
npm run admin:create -w apps/web
npm run dev
```

Site: `http://localhost:3000` • Conturi: `/account` • Dashboard: `/dashboard` • Administrare: `/admin`.

Pentru aplicația mobilă:

```bash
cp apps/mobile/.env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL trebuie să fie URL-ul serverului accesibil telefonului,
# de ex. http://192.168.1.100:3000 (nu localhost pe un telefon fizic)
npm run start -w apps/mobile
```

## Scenariu de test

1. Creează un cont de prestator (categoria exactă `Renovări`, județ `Hunedoara`).
2. Autentifică-te cu contul ADMIN creat din linia de comandă, apoi aprobă prestatorul în `/admin`.
3. Creează un cont de client și autentifică-te.
4. Trimite o solicitare prin formularul de pe prima pagină, fiind autentificat.
5. În `/admin`, atribuie cererea prin butonul de matching.
6. Intră în contul prestatorului, vizualizează lead-ul și trimite o ofertă.
7. Reautentifică-te ca client, vizualizează și acceptă oferta.

## Aspecte obligatorii înainte de producție

**Acesta este un MVP de dezvoltare, NU un serviciu production-ready.** Nu instala pe un domeniu public cu date reale înainte de implementarea următoarelor: rate limiting pe autentificare/formulare, verificare email, resetare parolă, protecție anti-spam, consimțământ și politici GDPR, audit log, validarea categoriilor și județelor pentru prestatori, rotația tokenurilor, protecție CSRF pentru operațiunile autentificate prin cookie, infrastructură HTTPS, observabilitate, backupuri și teste E2E. Panoul admin folosește rolul ADMIN și cookie httpOnly. MFA și audit log sunt obligatorii înainte de producție.

În v0.4 cererile necesită cont CLIENT: fiecare cerere este legată de utilizator și ofertele pot fi urmărite în dashboard. Clientul trebuie să se autentifice înainte de a trimite formularul.

Nu există integrări Polsia. Nu există push, plăți, mesagerie, distribuție App Store / Google Play sau deployment configurat.

### Limitele verificării

Arhiva a fost inspectată static. Nu s-au putut instala dependențele în mediu (registrul npm nu este disponibil offline), deci build-ul, migrarea bazei de date și testele runtime nu sunt verificate.

## Versiunea 0.3 — modificări

- Eliminat `ADMIN_API_KEY` din interfața browserului. Endpointurile admin necesită rolul `ADMIN` autentificat.
- Adăugat script local `npm run admin:create -w apps/web` pentru contul admin inițial.
- Pentru cereri autentificate din browser a fost adăugată verificarea ant-CSRF a originii. Setați `APP_ORIGIN` exact ca domeniul site-ului.
- Tokenul pentru aplicația mobilă se salvează în Expo SecureStore și se restaurează la repornirea aplicației.

**Limitări:** acest cod nu este încă verificat prin build, testare PostgreSQL sau E2E; nu folosiți date reale înainte de audit, MFA, rate limiting și politici GDPR.


## v0.4 — verificări și dezvoltare

- API-ul pentru cereri necesită cont CLIENT și leagă cererea de client.
- Verificări de origine pentru login / register; autentificarea din aplicația mobilă folosește cereri JSON fără cookie, iar cererile cu Bearer autentificat sunt acceptate.
- Matching-ul administratorului folosește tranzacții PostgreSQL serializabile pentru a reduce riscul atribuirilor concurente peste limita de trei; aplicația trebuie să trateze separat eventuale erori de retry.
- `docker-compose.yml` pentru PostgreSQL local, `/api/health` pentru verificarea conexiunii la DB, `scripts/smoke-check.mjs` și workflow GitHub Actions.
- **Atenție**: v0.4 nu este încă validată end-to-end, nici deployată.

### PostgreSQL local cu Docker

```bash
cp .env.example .env
# Configurează POSTGRES_PASSWORD în .env, apoi pune aceeași parolă în apps/web/.env (DATABASE_URL).
docker compose up -d db
npm install
npm run db:generate
npm run db:push
node scripts/smoke-check.mjs
npm run dev
```

Folosește un secret real pentru `AUTH_SECRET`, iar la publicare configurează HTTPS și gestiunea secretelor separat. Workflow-ul CI efectuează build/typecheck când dependențele sunt instalabile.

## Actualizare v0.5 pentru Codex

Rulați `npm test` pentru cele trei teste unitare fără dependențe externe. Sunt teste ale regulilor de business (nu ale API-urilor sau bazei de date). Modificările de autorizare sunt detaliate în `docs/STATUS_V05.md`.

**Notă CI:** workflow folosește momentan `npm install`, deoarece nu există `package-lock.json` generat și verificat. La prima instalare online, comiteți lockfile-ul și înlocuiți cu `npm ci`.

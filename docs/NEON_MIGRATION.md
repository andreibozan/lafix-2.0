# Transfer Render → Neon

Stare: migrare finalizată pe 21 noiembrie 2026 pentru mediul de test. Exportul și restaurarea au fost executate pe 13 noiembrie. Înainte de schimbarea conexiunii, toate înregistrările din cele 14 tabele și toate constrângerile au fost comparate și sunt identice; comparația include istoricul celor patru migrări originale. Sursa Render este păstrată temporar, fără acces extern. Nu este o lansare în producție.

## Rezultate verificate pe 21 noiembrie 2026
- DATABASE_URL în Render indică Neon prin conexiune directă cu TLS și connect_timeout=15. Cheile de autentificare și criptare existente au fost păstrate.
- render.yaml folosește sync: false pentru DATABASE_URL, astfel încât o sincronizare Blueprint să nu reasocieze aplicația la baza Render care expiră.
- Build Next.js reușit și deploy Render dep-dc0jlsjm8hqs73eo1t70 live, commit f3c7b0c9d8dbcaef254c3ceadc157d9afc84fc11.
- Migrarea aditivă project_experience a fost aplicată pe Neon; cinci migrări finalizate sunt prezente după pornire.
- GET /api/health răspunde cu status ok; prima pagină și /meseriasi au fost deschise în browser. Directorul fără prestatori afișează corect starea goală.
- Regula temporară /32 a fost eliminată; Render afișează zero intervale IP permise și acces extern blocat.
- Autentificarea cu un cont și fluxul complet client/prestator/admin nu au fost retestate live în această migrare. Nu au fost introduse date reale sau activate servicii plătite. Trimiterea de emailuri și auditul de securitate rămân condiții separate înainte de producție.
- Instalarea Render a raportat 19 vulnerabilități de dependențe (12 moderate, 7 high); evaluarea și remedierea lor rămân deschise înainte de producție.

## Parametri
- Sursa: Render lafix-staging-db, PostgreSQL 18, Frankfurt, lafix_staging.
- Destinație: Neon Free, regiune UE apropiată, PostgreSQL 18, bază lafix_staging (numele este verificat de scripts/start-staging.mjs).
- Păstrăm AUTH_SECRET și AUTH_ENCRYPTION_KEY existente. Schimbarea cheii de criptare ar face secretele MFA și outboxul existente ilizibile.
- Pentru această instanță mică, o conexiune PostgreSQL Neon directă cu TLS poate fi folosită de Prisma și de migrări fără modificarea schemei. URL PostgreSQL cu sslmode=require și connect_timeout=15; nicio parolă în GitHub/chat.

## Procedură
1. Creați proiectul și baza goală Neon în contul operatorului. Verificați planul Free înainte de creare.
2. Asigurați accesul privat din Render sau aprobați separat o regulă externă temporară strictă /32 pentru export. Nu deschideți 0.0.0.0/0.
3. Opriți temporar scrierile aplicației și workerul; salvați configurația anterioară în afara repository-ului. Exportul singur nu capturează scrieri ulterioare.
4. Folosiți pg_dump versiunea 18 sau mai nouă, format custom, fără owner/ACL. URL-urile se transmit prin fișiere/mediu private, nu prin argumente sau loguri. Fișierul rezultat conține date și se păstrează cu permisiuni restrictive, niciodată în Git.
5. Restaurați cu pg_restore --no-owner --no-acl --exit-on-error --single-transaction numai în baza goală. Includeți _prisma_migrations. Nu folosiți --clean și nu aplicați migrările înainte de restaurare.
6. Comparați tabelele, numărul de rânduri, cheile/legăturile și istoricul migrărilor; validați citirea câmpurilor criptate cu cheia existentă fără afișarea secretelor.
7. Actualizați DATABASE_URL în Render. Actualizați Blueprint pentru a nu reasocia vechea bază la următorul sync; păstrați resursa sursă declarată până la încheierea transferului.
8. Reporniți și verificați /api/health, autentificarea, cererile, ofertele și admin. Abia după verificare permiteți scrieri normale.
9. Eliminați regula temporară de acces extern. Păstrați sursa pentru rollback; nu o ștergeți fără autorizare. După scrieri pe Neon, rollback-ul necesită reconciliere, nu simpla schimbare înapoi a URL-ului.

Referință: https://neon.com/docs/import/migrate-from-postgres

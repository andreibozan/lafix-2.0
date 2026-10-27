# Administrare și autentificare — 27 octombrie 2026

Implementare de dezvoltare. PostgreSQL rămâne în așteptare la cererea utilizatorului. Nu folosiți date reale și nu publicați serviciul înainte de testare și audit.

## Interfețe
- `/admin/login`: autentificare dedicată, fără înregistrare publică ADMIN.
- `/admin`: acces verificat pe server; utilizatorii fără sesiune merg la login, celelalte roluri la dashboard.
- `/demo/admin`: previzualizare publică, numai date fictive, fără acces la DB sau operațiuni de modificare.
- `/prestatori`: experiență în stilul original, accesibilă din comutatorul client/prestator și secțiunea dedicată de pe prima pagină.

Panoul include solicitări, prestatori, clienți, oferte, tranzacții, sesizări și audit. Filtrele validează textul, starea și intervalul UTC, cu paginare de 20 de rezultate. Indicatorii separă alimentările de portofel de veniturile din deblocări/Pro. Acțiunile includ calificare, aprobare/suspendare, matching, restituiri și soluționarea sesizărilor. Operațiunile reale necesită rol ADMIN și baza de date.

## Securitate implementată, încă neverificată cu PostgreSQL
JWT verificat cu algoritm, emitent și audiență explicite; sesiuni persistente revocabile; sesiune ADMIN de două ore; verificarea rolului din DB; limitare persistentă de 10 încercări de login/15 minute; hash bcrypt de rezervă pentru email necunoscut; redirecționări limitate după rol; evenimente de audit. Parolele și tokenurile nu sunt incluse în datele panoului.

În producție cookie-urile sunt Secure. Excepția explicită `ALLOW_LOCAL_HTTP_AUTH=true` funcționează numai cu APP_ORIGIN HTTP loopback pentru verificări locale. Nu activați această excepție pentru un domeniu public.

## Conectarea ulterioară
Necesită Node 22+ și o bază sintetică izolată `lafix_test`. Furnizați DATABASE_URL prin mediul local privat; `npm run auth:configure` creează apps/web/.env cu permisiuni 0600 și secret aleatoriu, refuzând suprascrierea. Nu a fost executat aici.

Rulați `npm run db:generate`, `npm run db:migrate`, apoi `npm run admin:create -w apps/web`. Scriptul cere parola ascuns și refuză promovarea unui utilizator existent. `npm run auth:cleanup -w apps/web` curăță sesiunile și contoarele expirate; programarea lui rămâne necesară.

Apoi executați `npm run test:integration` și `npm run test:e2e` pe baza de test, conform workflow-ului CI. Migrarea adaugă sesizări persistente, contoare de autentificare și indexuri; importă sesizările istorice din audit. Nu a fost aplicată local.

## Verificări și limite
Build Next.js, TypeScript, generare/validare Prisma: trecute. Teste unitare și HTTP: 13 trecute, zero omise. Verificare manuală în browser: cele șapte secțiuni demo, căutare fără rezultate, acțiuni demo dezactivate, redirecționare admin/login, mesaj de configurare absentă și afișare mobilă 390px fără depășire orizontală.

Testele PostgreSQL și Playwright E2E sunt scrise, dar nu au fost executate cu succes local. Autentificarea efectivă, migrarea, concurența și fluxul complet rămân neverificate. MFA, verificarea emailului, resetarea parolei, remedierea dependențelor vulnerabile și analiza independentă de securitate sunt încă necesare înainte de producție. Plățile reale rămân dezactivate.

# Versiune de test online

Configurare pregătită pentru Render, fără servicii create sau publicare efectuată. Nu este o lansare în producție. Folosiți numai persoane și cereri fictive.

## Crearea versiunii de test
1. Autentifică-te sau creează un cont la https://dashboard.render.com/. Acceptarea condițiilor și eventualele cereri de acces GitHub se fac de titularul contului.
2. Alege New → Blueprint și repository-ul `andreibozan/lafix-2.0`, ramura `main`. Acordă acces numai repository-ului necesar.
3. Verifică resursele din `render.yaml`: un web service Free și PostgreSQL Free în Frankfurt. Nu adăuga o metodă de plată și nu accepta schimbarea la un plan plătit fără o decizie explicită.
4. Confirmă crearea numai după ce testele CI au trecut și configurația a fost verificată. Blueprint-ul creează resurse și efectuează publicarea inițială; `autoDeployTrigger: off` dezactivează actualizările automate ulterioare.
5. Render generează `AUTH_SECRET` și `STAGING_ACCESS_PASSWORD` în setările private. Nu le copia în repository sau în chat. Parola de acces a previzualizării se consultă în setările serviciului. Numele de acces este `preview`.
6. Scriptul de pornire folosește `RENDER_EXTERNAL_URL` pentru originea HTTPS exactă. Dacă este necesar un domeniu diferit, setează `APP_ORIGIN` explicit. Nu folosi wildcard sau origine HTTP.
7. Scriptul aplică migrările și pornește site-ul numai dacă baza se numește `lafix_staging`, secretele sunt configurate și plățile sunt dezactivate. Dacă migrarea eșuează, serverul nu pornește.
8. Creează administratorul prin scriptul existent dintr-un mediu cu acces privat la DB. Planul Free nu oferă shell pe serviciu; nu deschide accesul public la DB doar pentru acest pas. Pentru administrare remote va fi necesar acces privat aprobat sau un mediu de administrare configurat separat. Nu există administrator implicit și nu există parolă publică.

## Protecția previzualizării
Toate paginile, fișierele și API-urile sunt protejate de o parolă de previzualizare când `DEPLOYMENT_STAGE=staging`. Lipsa parolei blochează accesul cu 503. Singura excepție este GET `/api/health`, care răspunde numai cu disponibilitatea conexiunii la DB. Răspunsurile sunt marcate no-store/noindex.

Această parolă suplimentară nu înlocuiește autentificarea aplicației și rolurile CLIENT/PROVIDER/ADMIN. Configurația este pentru verificări în browser. Aplicația Expo cu Bearer token nu este încă integrată cu acest acces suplimentar; nu elimina protecția pentru a o testa pe un server public.

`BILLING_MODE=disabled`: nici plăți reale, nici alimentări simulate în acest mediu. Testele CI folosesc separat `lafix_test` și modul sandbox pentru verificarea monetizării fictive.

## Limite
Render Free este o previzualizare temporară, nu găzduire permanentă. PostgreSQL Free expiră după 30 de zile, nu are backupuri și web service-ul poate intra în repaus. Limitele și condițiile se verifică în pagina furnizorului înainte de creare: https://render.com/docs/free. Nu încărca date pe care trebuie să le păstrezi.

Blueprint-ul a fost pregătit după documentația oficială: https://render.com/docs/blueprint-spec. Publicarea și comportamentul pe Render nu au fost verificate. Este necesar un cont al titularului și confirmarea resurselor înainte de creare. MFA pentru administratori, verificarea emailului, resetarea parolelor și revizuirea de securitate rămân necesare înainte de producție.

## Verificare locală a configurației
Build Next.js și TypeScript au trecut. Cele două teste de acces/configurare și testul HTTP pe serverul compilat au trecut: paginile, API-urile și ilustrațiile sunt blocate fără parolă; o parolă corectă permite pagina; lipsa configurării răspunde 503. Sintaxa YAML a fost verificată local, dar Blueprint-ul nu a fost validat de un cont Render și nu a fost publicat. Testele reale PostgreSQL și E2E sunt urmărite separat în GitHub Actions.

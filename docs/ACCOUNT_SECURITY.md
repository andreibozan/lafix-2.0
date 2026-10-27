# Verificare email, recuperare parolă și 2FA

Implementare în același Next.js/PostgreSQL și aceeași aplicație Expo. Nu există servicii Polsia.

## Fluxuri
Înregistrarea creează un cont neconfirmat și un email în coada persistentă. Nu emite sesiune. Confirmarea se face explicit în pagina `/account/verify`; linkul expiră în 24 de ore și se poate folosi o singură dată. Conturile existente neconfirmate trebuie să solicite confirmarea din aceeași pagină.

`/account/forgot` afișează același răspuns pentru adrese existente și inexistente. Linkul de resetare expiră în 30 de minute, este consumat tranzacțional și nu autentifică utilizatorul. Resetarea revocă toate sesiunile, inclusiv cele mobile, și păstrează 2FA activ.

`/account/security` configurează TOTP (6 cifre/30 secunde), cu o cheie manuală sau un link otpauth către aplicația de autentificare. Activarea cere parola și un cod valid. Cheia este criptată AES-256-GCM, cu scop separat de criptarea emailurilor. Fiecare cod TOTP este acceptat o singură dată. Cele zece coduri de recuperare sunt afișate o singură dată, păstrate numai sub formă de hash și consumate atomic. Regenerarea lor cere parola și al doilea factor și revocă sesiunile anterioare.

Administratorii fără 2FA primesc numai o sesiune pentru configurare; API-urile administrative refuză accesul până la activare. 2FA nu poate fi dezactivat pentru ADMIN. Pentru CLIENT/PROVIDER este opțional. Resetarea parolei prin email nu reprezintă o metodă de eliminare a 2FA.

Linkurile folosesc un token în fragmentul URL, eliminat de pagină înainte de trimiterea formularului. Nu există tokenuri în query string, loguri sau API-uri publice. Browserul nu confirmă linkul prin simpla deschidere, pentru a evita consumarea de către scanere de email.

## Configurare în Render
`AUTH_ENCRYPTION_KEY`: cheie separată de 32 de octeți, codificată base64, generată privat de Render din Blueprint. Nu o copia în GitHub sau în chat. Păstreaz-o securizat pentru restaurarea secretelor din backup. Rotația ei necesită recriptarea datelor; nu o înlocui arbitrar.

`RESEND_API_KEY` și `MAIL_FROM`: se setează privat în Render după crearea contului Resend și confirmarea expeditorului. Nu este suficientă scrierea unei adrese Gmail inexistente. Expeditorul și credențialele nu sunt configurate automat. În lipsa lor, înregistrarea și solicitarea emailurilor răspund explicit că serviciul nu este configurat; nu pretind livrare.

Coada EmailOutbox conține payload criptat și expirare, cu lease, număr limitat de încercări și retry cu întârziere. Payload-ul este șters după livrare. Cererile folosesc cheia de idempotentă a furnizorului. Pornirea pe staging include worker-ul de email în același serviciu dacă expeditorul este configurat. Pe Free worker-ul nu rulează când serviciul este suspendat; pentru livrare stabilă este necesar un serviciu permanent. `apps/web/scripts/mail-worker.mjs --once` poate fi folosit într-un job privat configurat separat.

MAIL_DELIVERY_MODE=outbox este acceptat numai cu DEPLOYMENT_STAGE=test și baza lafix_test. Nu este o opțiune de ocolire a verificării pe staging. CI citește emailurile sintetice criptate direct din baza izolată și urmează aceleași endpointuri de verificare.

## Backup și restaurare
Configurația existentă Render Free nu include backupuri. Exemplul `infra/render-recovery.yaml.example` pregătește trecerea bazei existente la un plan plătit cu recuperare gestionată; nu este activat și nu se importă fără verificarea prețului și acordul titularului. Nu se deschide accesul public la baza de date.

Workflow-ul CI exportă o bază exclusiv sintetică, o restaurează într-o bază distinctă `lafix_restore_check` și verifică istoricul migrărilor, utilizatorul, solicitarea legată și decriptarea unui secret cu cheia separată. Această verificare nu demonstrează încă recuperarea unui incident pe Render. Repetă procedura în infrastructura plătită înainte de producție, fără a înlocui baza activă până când copia restaurată a fost verificată.

Surse tehnice: RFC 6238, recomandările OWASP pentru recuperarea parolei și MFA, API Resend și documentația Render Recovery. Testele locale de criptare/TOTP și build-ul sunt verificate separat de testele PostgreSQL/CI și de livrarea efectivă în inbox. Nu trata codul implementat ca dovadă de livrare sau backup activ.

# LaFix mobile — pregătire magazine, 28 octombrie 2026

O singură aplicație Expo pentru CLIENT și PROVIDER, conectată la API-ul Next.js existent. Configurația este locală; nu există încă proiect EAS asociat, conturi de dezvoltator, build-uri native semnate sau aplicații trimise în magazine. Utilizatorul a confirmat că nu are conturile și nu aprobă activarea serviciilor plătite.

## Configurație pregătită
- `apps/mobile/eas.json`: preview intern APK, simulator iOS, production AAB/iOS store cu versiuni incrementate pe EAS.
- Identificatori: `ro.lafix.app` pentru magazine și `ro.lafix.app.preview` pentru test. Verificați disponibilitatea înainte de înregistrare; identificatorii devin greu de schimbat după lansare.
- `app.config.js`: refuză build EAS fără API HTTPS și proiect Expo; refuză staging/localhost în production. Aceste verificări nu certifică disponibilitatea backendului.
- Scheme distincte lafix/lafix-test; nu este implementată încă rutarea linkurilor de verificare email în aplicație. Linkurile de securitate sunt deschise în browser.
- Token în SecureStore, parole eliminate din starea formularului după login/logout, backup Android dezactivat și permisiuni media/microfon inutile blocate.
- Oferte cu lucrări/materiale/termen/garanție, statusuri românești, confirmarea finalizării și recenzie trimisă în moderare; acestea necesită API-ul nou din STATUS_V08.

## Pașii după crearea conturilor
1. Creați cont Expo și proiect LaFix în organizația deținută de operator. Introduceți UUID-ul ca `EXPO_PUBLIC_EAS_PROJECT_ID` în mediile EAS preview și production. Nu includeți chei secrete în variabile EXPO_PUBLIC.
2. Configurați `EXPO_PUBLIC_API_URL` separat pentru fiecare mediu, ca origine HTTPS, fără /api la final. Backendul production nu este încă ales/validat.
3. Backendul actual Render staging folosește Basic Auth pentru browser. Aplicația folosește Bearer și NU conține parola preview. Pentru test mobil este necesar un mediu separat compatibil sau o soluție de acces revizuită, fără dezactivarea accidentală a protecției actuale.
4. Din apps/mobile, cu EAS CLI instalat: `eas login`, `eas build --profile preview --platform android`; pentru simulator `eas build --profile simulator --platform ios`.
5. După toate verificările: `eas build --profile production --platform all`. Conectați conturile deținute de operator pentru semnare. Nu activați un plan plătit fără acord explicit.
6. Distribuiți mai întâi prin TestFlight și testarea internă Google Play; trimiterea în magazine și publicarea nu sunt automatizate în această configurație.

## Obligatoriu înainte de trimitere
- Implementare și testare ștergere cont din aplicație, cu reautentificare, tratarea lucrărilor active și politica explicită de retenție; și pagină web pentru solicitarea ștergerii. Funcția nu este încă implementată.
- Operator legal, email suport funcțional, URL-uri publice de confidențialitate/termeni și declarații App Privacy/Data Safety corecte.
- Expeditor verificat, email/reset/2FA testate integral; backend fără date reale până la validare.
- Pictogramă finală, splash, capturi reale pe dispozitive și descrieri de magazin. Nu trimiteți placeholder-uri.
- Validarea versiunilor native, cerințelor SDK/target curente și a compatibilității Expo înainte de build; exportul Hermes nu dovedește conformitatea unui binar nativ.
- Teste pe iPhone și Android fizice: autentificare, 2FA, sesiune expirată, lipsă rețea, cereri, maximum trei prestatori, ofertare, acceptare, finalizare, recenzie, accesibilitate și tastatură.
- Conturi sintetice pentru review, backend disponibil, audit de securitate, backup/restaurare.

## Verificare locală
Testul `tests/mobile-config.test.mjs` verifică separarea mediilor și refuzul configurărilor incomplete. Exporturile JavaScript/Hermes iOS și Android sunt verificări de bundling, nu fișiere IPA/AAB și nu teste pe dispozitiv.

Referințe oficiale: https://docs.expo.dev/build/eas-json/ și https://developer.apple.com/support/offering-account-deletion-in-your-app/

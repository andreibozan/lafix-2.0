# Experiența proiectelor — 28 octombrie 2026

Implementare locală; această versiune nu este publicată pe GitHub/Render.

## Adăugat
- Etape în română și tabel de comparație: lucrări incluse, materiale, termen, garanție. Ofertele vechi afișează explicit câmpurile nespecificate.
- Finalizare doar de clientul proprietar, doar după acceptare; anulare înainte de acceptare. Tranzacție cu blocarea solicitării și audit.
- O singură recenzie per proiect finalizat cu ofertă acceptată, publicare manuală prin admin; pagină publică doar pentru prestatori aprobați.
- Profil profesional editabil: prezentare și disponibilitate; nu pretinde verificarea calificărilor.
- /admin/interventii: proiecte active în ordinea vechimii, sugestii de intervenție, responsabil și notă persistente, moderare recenzii, emailuri restante.
- Indicatori agregați pe 30 de zile: solicitări, sursa popup, proiecte cu oferte, acceptări și finalizări. Fără cookie-uri de urmărire.
- Emailuri în outbox criptat pentru cerere nouă, ofertă nouă și acceptare. Numai către adresa verificată a contului, niciodată către contactul neconfirmat din popup. Același worker cu retry/idempotency. Fără expeditor configurat nu sunt trimise.
- Migrare SQL aditivă 202610280001_project_experience.

## Verificări executate
- Prisma generate: trecut.
- TypeScript: trecut.
- Next.js production build: trecut.
- node --test tests/*.test.mjs: 23 trecute, 1 HTTP omis (server indisponibil).
- Server local: blocat EPERM la listen pe portul 3105. Nicio încercare de publicare în producție.

## Teste adăugate, încă neexecutate
- Integrare PostgreSQL: proprietate, finalizare, recenzie unică, moderare și acces indicatori.
- Browser: lipsa accesului anonim la profilul privat și la intervenții.
- Migrarea nouă și integrarea emailurilor necesită rularea CI PostgreSQL înainte de publicare. Rezultatele vechi ale CI nu validează aceste schimbări.

## Lucrări rămase din propunere
- Portofoliu foto cu upload privat controlat, verificarea tipurilor, dimensiunilor și consimțământului; raportarea recenziilor și decizia de respingere/arhivare.
- Măsurarea deschiderii popup-ului și abandonului (acum sunt măsurate doar rezultatele persistate); definiție și implementare a retenției datelor.
- Notificări pentru alocare și finalizare, setări notificări și configurarea expeditorului real.
- Adaptarea noilor ecrane/atribute în aceeași aplicație Expo; testare dispozitive.
- Pilotul local: categorii/localitate și prestatori confirmați de operator, fără date reale înainte de verificările necesare.
- Backup durabil și verificare independentă de securitate; fără servicii plătite activate.

## Reproducere
npm ci
npm run db:generate
npm run typecheck
npm run build
npm test
Cu PostgreSQL de unică folosință lafix_test și mediul CI documentat: npm run db:migrate, npm run test:integration și npm run test:e2e.

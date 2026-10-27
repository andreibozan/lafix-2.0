# Lansare LaFix fără monetizare

## Decizie de produs
MARKETPLACE_MODE=free este implicit. Prestatorul aprobat primește gratuit acces la cererile calificate care îi sunt alocate. Nu este necesar un portofel, un abonament sau o deblocare contra cost pentru a vedea contactul, a trimite o ofertă ori pentru acceptarea ofertei de către client. Limita rămâne maximum trei prestatori.

BILLING_MODE=disabled rămâne setarea găzduirii. Toate endpointurile de debitare, creditare demonstrativă și restituire rămân dezactivate în modul gratuit. Prețurile și Pro sunt eliminate din experiența publică gratuită; ruta veche de abonament explică accesul gratuit. Codul pilot de monetizare este păstrat pentru o etapă ulterioară, activabilă numai explicit cu MARKETPLACE_MODE=paid. CI verifică separat modul gratuit și pilotul sandbox cu date fictive.

Aprobarea prestatorului, calificarea cererii, alocarea și controalele de proprietate rămân obligatorii. Cererile nealocate sau necalificate și accesul retras prin restituire nu devin publice.

## Stare de publicare
Această schimbare pregătește lansarea, dar nu autorizează folosirea cu persoane reale înainte de închiderea cerințelor de securitate din AGENTS.md. Versiunea Render rămâne staging cu parolă și PostgreSQL temporar. Nu schimbați DEPLOYMENT_STAGE sau protecția de acces pentru a simula o lansare completă.

## Informații încă lipsă
- Domeniu dorit: lafix.eu, neînregistrat de titular în momentul solicitării. Disponibilitatea și cumpărarea nu au fost verificate/efectuate.
- Email propus: lafix@gmail.com, încă necreat/neconfirmat. Nu este afișat drept contact funcțional.
- Identitatea operatorului/firmei: necomunicată. Nu au fost inventate denumiri, adrese sau date de identificare.
- Domeniul pentru email tranzacțional și furnizorul de email nu sunt configurate.
- Găzduirea persistentă, backupurile și monitorizarea de producție nu sunt configurate. Nu au fost activate planuri plătite.

## Condiții rămase înainte de lansarea pentru utilizatori reali
1. Toate testele de integrare și E2E verzi pe același commit; verificarea pe telefoane și analiza independentă de securitate.
2. Verificare email, recuperare parolă, MFA pentru administratori și limitarea persistentă a înregistrărilor/formularelor. Aceste cerințe nu sunt rezolvate prin simpla parolă a staging-ului.
3. Contact, informare privind datele, termeni, retenție și mecanism de ștergere, cu datele reale ale operatorului și revizuire adecvată.
4. Remedierea vulnerabilităților dependențelor; backup și restaurare demonstrate, monitorizare și procedură de incident.
5. Bază și secrete de producție separate de staging și CI; HTTPS pe domeniul verificat. Nu refolosiți datele sau parolele de test.

Acestea sunt blocaje de lansare cunoscute; nu sunt marcate ca finalizate.

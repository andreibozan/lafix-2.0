# Solicitări fără cont, numai prin experiența pop-up

Butonul existent „Începe proiectul tău” deschide și redeschide aceeași fereastră. Deschiderea manuală anulează afișarea automată programată la 15 secunde. Formularul pop-up permite trimitere fără autentificare; formularul separat din pagină și `/api/requests` cer în continuare un CLIENT autentificat.

Fluxul anonim folosește `/api/requests/popup`, un ticket semnat de 10 minute legat de un cookie httpOnly, verificare de origine, consimțământ explicit verificat pe server, câmp-capcană și limite persistente globale/per email. Ticketul poate crea o singură solicitare, inclusiv la retrimiteri simultane. Limitele inițiale sunt 100 de solicitări/oră global și trei/oră per email; sunt limite de protecție ajustabile după monitorizare, nu protecție completă împotriva tuturor formelor de spam.

Separarea este la nivel de flux și endpoint. Un API web public poate fi apelat programatic; nu există o garanție criptografică că un utilizator a privit efectiv pop-up-ul. Endpointul obișnuit nu devine anonim.

Cererea este marcată POPUP, are clientId null și data acordului de contact. Administratorul o califică înainte de matching. Datele nu apar altor vizitatori. Dacă proprietarul emailului confirmă ulterior un cont CLIENT cu aceeași adresă, cererile sale anonime sunt asociate contului; simpla creare a unui cont neconfirmat nu poate revendica solicitări.

Interfețele rămân în română. Mediul online este în continuare de test, fără monetizare și fără lansare pentru clienți reali.

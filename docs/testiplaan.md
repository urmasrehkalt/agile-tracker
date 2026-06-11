# Süsteemi testiplaan — Agile Tracker

**Õppeväljund:** ÕV2 — koostab süsteemi testiplaani
**Grupp:** TAK25
**Koostaja:** Urmas Rehkalt
**Kuupäev:** 21.05.2026
**Rakenduse versioon:** `main` haru, commit `f64dcc2`

---

## 1. Rakenduse kirjeldus

**Nimi:** Agile Tracker (repo `urmas-agiilne-tracker`)

**Mille jaoks rakendus on mõeldud:** Agile Tracker on veebipõhine Kanban-tüüpi tahvlirakendus user story'de haldamiseks. See on mõeldud agiilse meeskonna projektide jälgimiseks: ühel ekraanil on näha kõik töös olevad lood kolmes staatuses (Todo / Backlog, Doing, Done) ning lugusid saab hiirega ühest veerust teise lohistada vastavalt sellele, kuidas töö edeneb. Rakendus toetab mitut projekti, vastuvõtutingimusi, kommentaare ja mockup-piltide manustamist.

**Olulisemad funktsioonid (6 tk):**

1. **Kanban-tahvli vaade** — kolm veergu (Todo / Backlog, Doing, Done), iga veeru pealkirjas lugude arv ja punktide summa.
2. **Lugude haldamine (CRUD)** — uue loo loomine, olemasoleva muutmine ja kustutamine.
3. **Drag-and-drop** — loo kaardi lohistamine veerust veergu muudab automaatselt loo staatust ja salvestab muudatuse serverisse.
4. **Mitme projekti haldus** — projektide loomine, muutmine, arhiveerimine ja kustutamine; igal projektil oma loo-numbrid (#1, #2 jne).
5. **Mockup-piltide üleslaadimine** — loo juurde saab manustada PNG/JPEG/WebP pildi (max 5 MB).
6. **Otsing ja filtrid** — lugude otsimine pealkirja järgi ja filtreerimine punktide järgi (≥ 1, ≥ 3, ≥ 5, ≥ 8).

**Tehniline taust (lühidalt):** Python 3.12 + FastAPI backend, vanilla HTML/CSS/JS frontend (SortableJS lohistamiseks), andmed JSON-failides. Käivitub `./start.sh` käsuga, vaikimisi port 8000.

---

## 2. Testimise eesmärk

**Mida testimisega kontrollitakse:**
Testimise eesmärk on veenduda, et Agile Trackeri põhifunktsioonid töötavad ootuspäraselt nii tava­olukordades kui ka veaolukordades. Konkreetselt kontrollime, et:

- Lugude loomine, muutmine ja kustutamine talletab andmed õigesti.
- Kasutajaliidese drag-and-drop muudab loo staatust ja kuvab uue olukorra pärast lehekülje värskendamist.
- Mitme projekti vahel saab vahetada ja andmed püsivad projektipõhiselt eraldi.
- Mockup-piltide üleslaadimine järgib mõõdu- ja tüübipiiranguid.
- Vigaste sisendite korral kuvab rakendus arusaadava veateate ja ei salvesta vigaseid andmeid.

**Miks neid funktsioone on vaja testida:**
Loetletud funktsioonid moodustavad rakenduse igapäevase töövoo — kasutaja puutub nendega kokku iga kord, kui ta rakendust avab. Kui näiteks loo salvestamine vaikselt ebaõnnestuks või drag-and-drop ei salvestaks staatuse muutust, kaotaks meeskond ülevaate oma tööst. Veaolukordade testimine kindlustab, et rakendus ei "lähe katki" valede sisendite korral, vaid juhendab kasutajat arusaadavalt edasi. Piir­juhtumite (nt 5 MB suuruse failipiirang) testimine kaitseb rakendust ressursside ülekoormamise ja ettenägematu käitumise eest.

---

## 3. Testkeskkond ja eeldused

| Parameeter | Väärtus |
|---|---|
| Operatsioonisüsteem | macOS / Linux / Windows (testitud macOS-il) |
| Brauser | Google Chrome viimane versioon (alternatiiv: Firefox viimane versioon) |
| Rakenduse käivitus | `./start.sh` projektikataloogis |
| Rakenduse URL | http://localhost:8000 |
| Serveri port | 8000 |
| Eeltingimused | Python 3.11+ paigaldatud; pordis 8000 ei jookse muu rakendus |
| Algandmed | Esmakäivitusel kopeeritakse `stories.example.json` → `stories.json` (3 näidislugu); olemas üks vaikeprojekt |

Enne iga testseansi algust soovitan rakenduse käivitada puhta seisuga (kustutada `data/stories.json` ja `data/projects.json`, et taaskäivitusel tekiks näidisandmestik), tagamaks korratavus.

---

## 4. Testjuhtumid

Testiplaan sisaldab **8 testjuhtumit**:

| Nr | Nimi | Tüüp | Fookus |
|---:|---|---|---|
| T1 | Uue loo loomine korrektsete andmetega | Tavakasutus | Loo CRUD — loomine |
| T2 | Olemasoleva loo muutmine | Tavakasutus | Loo CRUD — muutmine |
| T3 | Loo kustutamine | Tavakasutus | Loo CRUD — kustutamine |
| T4 | Loo lohistamine veerust "Todo / Backlog" veergu "Doing" | Tavakasutus | Drag-and-drop |
| T5 | Uue projekti loomine ja projektide vahetus | Tavakasutus | Projektihaldus |
| T6 | Mockup-pildi (PNG) üleslaadimine loo juurde | Tavakasutus | Mockup — happy path |
| T7 | Loo loomine tühja pealkirjaga | **Veaolukord** | Sisendi valideerimine |
| T8 | Üle 5 MB suuruse mockup-faili üleslaadimine | **Piirjuhtum** | Faili suurusepiirang |

Iga testjuhtum on järgnevalt esitatud eraldi alapeatükina koos tabeliga, mis sisaldab kõiki vajalikke välju, sealhulgas tühjad veerud **Tegelik tulemus** ja **Märkused**, mille testija täidab pärast testi sooritamist.

---

### T1 — Uue loo loomine korrektsete andmetega

| Väli | Sisu |
|---|---|
| **Tüüp** | Tavakasutus (positiivne juhtum) |
| **Eeltingimused** | Rakendus avatud aadressil http://localhost:8000. Vähemalt üks projekt valitud topbar'is. |
| **Testimise sammud** | 1. Vajuta topbar'is paremal nupule **„+ Uus story"**.<br>2. Veendu, et avaneb uue loo modaalaken.<br>3. Sisesta **Pealkirja** väljale `Testi sisselogimisvorm`.<br>4. Sisesta **Kirjelduse** väljale `Kontrolli, et tühi pealkiri annab vea`.<br>5. Vali **Projekti** rippmenüüst aktiivne projekt.<br>6. Sisesta **Punktide** väljale `3`.<br>7. Vali **Staatuseks** „Todo / Backlog" (vaikimisi).<br>8. Sisesta **Vastuvõtutingimuste** esimesele reale `Vorm avaneb klikiga`.<br>9. Vajuta nupule **„Salvesta"**. |
| **Oodatav tulemus** | Modaalaken sulgub. Veerus „Todo / Backlog" ilmub uus lookaart pealkirjaga `Testi sisselogimisvorm`, punktide märgisega `3p` ja loo numbriga (nt `#4`). Veeru päises olev lugude arv ja punktide summa suurenevad vastavalt. |
| **Edukuse kriteerium** | Test loetakse õnnestunuks, kui (a) modaalaken sulgub veatult, (b) uus lookaart on nähtaval „Todo / Backlog" veerus õigete andmetega, (c) pärast lehekülje värskendamist (F5) on lookaart endiselt olemas. |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T2 — Olemasoleva loo muutmine

| Väli | Sisu |
|---|---|
| **Tüüp** | Tavakasutus |
| **Eeltingimused** | Tahvlil on vähemalt üks lugu (nt T1-s loodud lugu). |
| **Testimise sammud** | 1. Klõpsa Kanban-tahvlil olemasolevale lookaardile, et avada selle detailvaade.<br>2. Vajuta nupule **„Muuda"**.<br>3. Muuda **Pealkirjaks** `Testi sisselogimisvorm (täiendatud)`.<br>4. Muuda **Punktide** väärtuseks `5`.<br>5. Lisa vastuvõtutingimuste loendisse uus rida tekstiga `Vorm valideerib tühja parooli`.<br>6. Vajuta nupule **„Salvesta"**. |
| **Oodatav tulemus** | Detailvaade värskendub uute väärtustega või sulgub. Tahvlil näitab vastav lookaart uut pealkirja, punktide märgis on `5p`, vastuvõtutingimuste arv on kasvanud ühe võrra. Veerupäises suureneb punktide summa kahe võrra (3 → 5). |
| **Edukuse kriteerium** | Test on õnnestunud, kui kõik muudatused on tahvlil nähtavad ning säilivad lehe värskendamise järel. |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T3 — Loo kustutamine

| Väli | Sisu |
|---|---|
| **Tüüp** | Tavakasutus |
| **Eeltingimused** | Tahvlil on vähemalt üks lugu, mille võib kustutada (nt T2-s muudetud lugu). |
| **Testimise sammud** | 1. Klõpsa kustutamiseks valitud lookaardile, et avada detailvaade.<br>2. Vajuta nupule **„Kustuta"**.<br>3. Kinnitusdialoogis vajuta **„OK"** / **„Jah, kustuta"**.<br>4. Oota, kuni dialoog sulgub. |
| **Oodatav tulemus** | Lookaart kaob Kanban-tahvlilt. Vastava veeru („Todo / Backlog") päises vähenevad lugude arv ja punktide summa kustutatud loo võrra. |
| **Edukuse kriteerium** | Test on õnnestunud, kui kustutatud lookaart ei ilmu tagasi pärast lehe värskendamist (F5) ning veeru loendurid on uuendatud. |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T4 — Loo lohistamine veerust „Todo / Backlog" veergu „Doing"

| Väli | Sisu |
|---|---|
| **Tüüp** | Tavakasutus (drag-and-drop) |
| **Eeltingimused** | Veerus „Todo / Backlog" on vähemalt üks lugu. Veerus „Doing" on lugude arv X (märgi enne testi üles). |
| **Testimise sammud** | 1. Aseta hiirekursor veerus „Todo / Backlog" oleva lookaardi peale.<br>2. Vajuta hiire vasak nupp alla ja hoia all.<br>3. Lohista kaart veergu „Doing" (raamil ilmub visuaalne tähistus, et veerg on sihtkoht).<br>4. Vabasta hiirenupp veerus „Doing".<br>5. Värskenda brauseris leht (F5). |
| **Oodatav tulemus** | Lookaart liigub veerust „Todo / Backlog" veergu „Doing". Veeru „Todo / Backlog" loendurid vähenevad (lugude arv −1, punktide summa −N) ja veeru „Doing" loendurid suurenevad samavõrra. Pärast lehekülje värskendust on lookaart endiselt veerus „Doing" (staatus on serverisse salvestunud). |
| **Edukuse kriteerium** | Test on õnnestunud, kui (a) lohistamine õnnestub visuaalselt, (b) veerupäiste loendurid uuenevad, (c) pärast F5 on staatus säilinud (st serverisse salvestatud, mitte ainult brauseris). |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T5 — Uue projekti loomine ja projektide vahetus

| Väli | Sisu |
|---|---|
| **Tüüp** | Tavakasutus |
| **Eeltingimused** | Vähemalt üks projekt on juba olemas (vaikimisi luuakse esmakäivitusel). |
| **Testimise sammud** | 1. Ava topbar'is projektide rippmenüü.<br>2. Vajuta valikule **„Halda projekte"** (või sarnasele).<br>3. Avanenud projektihalduses vajuta nupule **„+ Uus projekt"**.<br>4. Sisesta **Nimi** `Testprojekt 2026`.<br>5. Vali värv (nt sinine).<br>6. Vajuta **„Salvesta"** ja sulge projektihaldus.<br>7. Ava topbar'is projektide rippmenüü ja vali äsja loodud `Testprojekt 2026`.<br>8. Veendu, et tahvel on tühi (uues projektis pole veel lugusid).<br>9. Loo uus lugu (vt T1 sammud) — märgi loo number üles.<br>10. Vaheta topbar'is tagasi algselt aktiivsele projektile. |
| **Oodatav tulemus** | Uus projekt ilmub projektide rippmenüüsse valitud värviga. Aktiivse projekti vahetamisel uueneb Kanban-tahvel ja kuvatakse ainult vastava projekti lood. Uues projektis loodud loo number algab `#1`-st (mitte ei jätku globaalsest numeratsioonist). Algprojektile naasmisel on selle vanad lood endiselt olemas ja muutmata. |
| **Edukuse kriteerium** | Test on õnnestunud, kui (a) projekt salvestub, (b) projektide vahetus filtreerib lood õigesti, (c) loo numbrid on projektipõhised ja algavad ühest, (d) valitud projekt püsib pärast lehekülje värskendust (salvestub brauseri mällu / `localStorage`-isse). |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T6 — Mockup-pildi (PNG) üleslaadimine loo juurde

| Väli | Sisu |
|---|---|
| **Tüüp** | Tavakasutus |
| **Eeltingimused** | Olemas vähemalt üks lugu. Arvutis valmis PNG-pilt suurusega kuni 5 MB (soovitatud nt 200 KB testi­pilt). |
| **Testimise sammud** | 1. Klõpsa lookaardile, et avada detailvaade.<br>2. Leia mockupi sektsioon ja vajuta nupule **„Lisa mockup"** (või faili­valijale).<br>3. Vali arvutist PNG-pilt.<br>4. Kinnita üleslaadimine, kui rakendus seda küsib.<br>5. Oota, kuni üleslaadimine lõpeb.<br>6. Sulge detailvaade.<br>7. Värskenda lehekülg (F5). |
| **Oodatav tulemus** | Detailvaates kuvatakse pildi eelvaade. Lookaardile tahvlil ilmub väike mockupi pisi­pilt (thumbnail). Pärast lehekülje värskendust on mockup endiselt nähtav (fail on serverisse salvestatud kausta `data/mockups/`). |
| **Edukuse kriteerium** | Test on õnnestunud, kui (a) üleslaadimine lõpeb veatult, (b) eelvaade on detailvaates ja pisipilt lookaardil näha, (c) pildi täis­vaate avamine (klikiga eelvaatele) töötab, (d) fail püsib pärast lehekülje värskendust. |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T7 — Loo loomine tühja pealkirjaga (VEAOLUKORD)

| Väli | Sisu |
|---|---|
| **Tüüp** | **Veaolukord** — sisendi valideerimine |
| **Eeltingimused** | Rakendus avatud aadressil http://localhost:8000. |
| **Testimise sammud** | 1. Vajuta topbar'is nupule **„+ Uus story"**.<br>2. Veendu, et avaneb uue loo modaalaken.<br>3. Jäta **Pealkirja** väli tühjaks.<br>4. Sisesta **Punktide** väljale `2`.<br>5. Lisa vastuvõtutingimuste väljale üks rida (nt `Test`).<br>6. Vajuta nupule **„Salvesta"**. |
| **Oodatav tulemus** | Lugu **ei salvestu**. Modaalaken **ei sulgu**. Rakendus kuvab kasutajale arusaadava veateate (kas modaali sees või topbari/staatuse alal), mis viitab, et pealkiri on nõutav (näiteks „Pealkiri on nõutav" või sarnane). Tahvlil ei ilmu uut tühja lookaarti. |
| **Edukuse kriteerium** | Test on õnnestunud, kui (a) lugu ei salvestu (lugude arv tahvlil ei muutu), (b) kasutaja näeb veateadet, (c) modaali sisestatud andmed säilivad, et kasutaja saaks vea parandada. |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

### T8 — Üle 5 MB suuruse mockup-faili üleslaadimine (PIIRJUHTUM)

| Väli | Sisu |
|---|---|
| **Tüüp** | **Piirjuhtum** — failipiirangu kontroll |
| **Eeltingimused** | Olemas vähemalt üks lugu. Arvutis valmis PNG/JPEG fail, mille suurus on üle 5 MB (nt 6 MB; saab tekitada näiteks suure resolutsiooniga ekraani­tõmmise või dubleerides mitut pilti ühte). |
| **Testimise sammud** | 1. Klõpsa lookaardile, et avada detailvaade.<br>2. Vajuta nupule **„Lisa mockup"** (või faili­valija nupule).<br>3. Vali arvutist >5 MB pildifail.<br>4. Kinnita üleslaadimine.<br>5. Jälgi rakenduse reaktsiooni. |
| **Oodatav tulemus** | Üleslaadimine **ebaõnnestub**. Rakendus kuvab veateate, mis viitab failipiirangule (nt „Maksimaalne suurus on 5 MB" või HTTP 422 vastus). Loo juurde **uut mockupit ei salvestata**, eelmine mockup (kui oli) jääb muutmata. |
| **Edukuse kriteerium** | Test on õnnestunud, kui (a) üleslaadimine ei lõpetu õnnestumisega, (b) kasutajale näidatakse selget veateadet, (c) serveri pool faili ei salvestata (kontrollimiseks: `data/mockups/` kataloogi sisu ei muutu), (d) rakendus ei jää „rippuma" — kasutaja saab töö jätkata. |
| **Tegelik tulemus** |  |
| **Märkused** |  |

---

## 5. Tulemuste kokkuvõte

Pärast kõigi testjuhtumite läbiviimist täidetakse järgmine kokkuvõtte­tabel:

| Näitaja | Väärtus |
|---|---|
| Testjuhtumite koguarv | 8 |
| Õnnestunud testide arv |  |
| Ebaõnnestunud testide arv |  |
| Edukuse protsent |  |
| Testimise kuupäev |  |
| Testija nimi |  |

**Üldhinnang ja järeldused:**

_(Täidetakse pärast testimist. Kirjelda, kas rakendus käitub ootuspäraselt, milliseid vigu leiti, kas leitud vead on kriitilised või kosmeetilised ning millised on järgmised sammud — kas vead vajavad parandust ja kordustestimist, või on rakendus piisavalt stabiilne praeguseks otstarbeks.)_

---

## Lisad

**A. Testandmete näidised:**
- Tavalised punktiväärtused: `1`, `2`, `3`, `5`, `8`
- Lubatud mockupi formaadid: PNG, JPEG, WebP
- Mockupi maksimaalne suurus: 5 MB (5 242 880 baiti)
- Pealkirja maksimaalne pikkus: 200 tähemärki
- Vastuvõtutingimuste miinimum: 1 rida

**B. Kasulikud URLid testimise ajal:**
- Rakendus: http://localhost:8000
- API dokumentatsioon (Swagger): http://localhost:8000/docs (kasulik, kui soovitakse API-tasandil veaolukordi kontrollida)

# AI arendusassistendi reeglid — Agile Tracker

> **Seos tööriistaga:** selle projekti AI-assistent on **Claude Code**, mis loeb
> juhiseid kihiti kahest `CLAUDE.md` failist: kasutaja globaalsest
> (`~/.claude/CLAUDE.md` — üldine töövoog kõikidele projektidele) ja projekti
> juurkausta omast (`CLAUDE.md` — projekti faktid ja käsud). Käesolev dokument on
> nende kihtide **terviklik konsolideeritud reegliraamat**: see kirjeldab kogu
> reeglistikku ühes kohas ja täidab ülesande kohustuslikud peatükid.
>
> Oluline: juhisefail suunab AI käitumist, kuid ei ole tehniline sundmehhanism.
> Päris kaitse tekib reeglite, testide, harude ja review koosmõjus (vt ptk 5).

---

## 1. Projekti lühikirjeldus

**Agile Tracker** on kooliülesande raames tehtud veebirakendus user story'de
haldamiseks Kanban-laual (Todo / Doing / Done), koos projektide halduse ja
projektipõhise story-nummerdusega.

**Tehnoloogia:** FastAPI monoliit (Python 3.12, Pydantic v2) serveerib nii REST
API-t (`/api/*`) kui ka vanilla HTML/CSS/JS frontendit kaustast `public/` —
build-tööriistu ei ole. Andmehoidla on JSON-fail (`data/stories.json`)
atomic-write'iga; andmebaasi **ei ole** ja seda ei tohi ilma eraldi issue'ta
lisada.

**Failide paiknemine:**

| Asukoht | Sisu |
|---|---|
| `app/main.py` | Rakenduse seadistus, staatiliste failide mount |
| `app/routes.py` | API endpoint'id |
| `app/models.py` | Pydantic mudelid |
| `app/storage.py` | JSON-faili persistents (atomic write) |
| `public/` | Frontend: `index.html`, `app.js`, `style.css` |
| `tests/test_api.py` | Testid (pytest + FastAPI TestClient) |
| `docs/` | Dokumentatsioon ja ekraanipildid — **eesti keeles** |

**Kriitilised osad:**

- `app/storage.py` — atomic-write loogika tagab, et `data/stories.json` ei
  jää poolikuks ka katkestuse korral. Ära muuda seda ilma issue'ta, mis seda
  otseselt nõuab.
- `app/routes.py` API leping — frontend (`public/app.js`) sõltub sellest
  otseselt. Olemasolevaid endpoint'e, väljanimesid ja vastuse kujusid ei tohi
  muuta ilma dokumenteeritud issue'ta (vt API ühilduvus, ptk 6).
- `data/stories.json` — kasutaja andmed. Ära kirjuta üle ega kustuta.

---

## 2. Arenduskäsud

Kasuta **ainult** neid käske — ära leiuta alternatiive (nt paljast `pytest`
ilma virtuaalkeskkonnata või `uvicorn` käsitsi käivitamist):

| Tegevus | Käsk |
|---|---|
| Testid | `.venv/bin/pytest` |
| Rakenduse käivitus | `./start.sh` (loob `.venv` ja installib sõltuvused, kui puudu; uvicorn taustal pordil 8000, `PORT` env muudab) |
| Rakenduse seiskamine | `./start.sh stop` |
| Serveri staatus | `./start.sh status` |
| Logid | `.uvicorn.log` (PID failis `.uvicorn.pid`) |

- Testid jooksevad ilma töötava serverita ja ilma igasuguste
  produktsiooni-credentialiteta — kui test hakkab nõudma võrku või saladusi,
  on test valesti kirjutatud.
- `start.sh` ilma argumentideta taaskäivitab juba töötava serveri — seda ei
  pea enne käsitsi seiskama.

---

## 3. Koodistiil ja kokkulepped

- Järgi olemasolevaid mustreid: enne uue koodi kirjutamist loe sama kihi
  olemasolevat koodi (`routes.py` uue endpoint'i jaoks, `app.js` uue
  UI-loogika jaoks) ja kirjuta samas stiilis.
- Pydantic v2 idioomid (`model_config`, `field_validator`) — mitte v1 omad.
- Frontend on teadlikult build-vaba vanilla JS: **mitte** lisada npm-i,
  bundlereid, raamistikke ega TypeScripti.
- Eelista olemasolevaid abifunktsioone duplikaadi kirjutamisele; väldi
  copy-paste loogikat `routes.py` ja `storage.py` vahel.
- Väikesed ja fokusseeritud funktsioonid; üks loogiline muudatus korraga.
- Kommentaarid ainult sinna, kus kood ise ei suuda piirangut väljendada.
- README ja `docs/` on **eesti keeles** — dokumentatsiooni muudatused jäävad
  eesti keelde (vestluskeel on sellest eraldi).

---

## 4. Testimise reeglid

Testid on põhjus, miks `main` on alati deploy'itav. Reeglid:

- **Iga issue** peab sisaldama automaatteste, mis katavad selle acceptance
  criteria'd.
- **Bugfix:** kõigepealt kirjuta regressioonitest, mis viga reprodutseerib ja
  **ebaõnnestub**; alles seejärel paranda kood, kuni test läbib. Nii ei saa
  sama viga märkamatult tagasi tulla.
- **Feature:** uus käitumine saab testid implementatsiooniga samas harus,
  mitte "hiljem".
- Olemasolevat testi **ei tohi kustutada, vahele jätta ega lõdvendada**, et
  komplekt roheliseks saada. Päriselt aegunud testi võib muuta ainult eraldi
  põhjendusega, mis öeldakse kasutajale otse välja.
- Testid peavad jooksma ilma produktsiooni-credentialite ja -teenusteta.
- Enne töö valmis kuulutamist käivita **kogu** testikomplekt
  (`.venv/bin/pytest`), mitte ainult uued testid.
- Kui leiad eelnevalt eksisteeriva punase testi, **raporteeri** see
  kasutajale — ära paranda vaikides ega ignoreeri.

---

## 5. Git-töövoog ja main-haru kaitse

**Kuldreegel: mitte ühtegi koodimuudatust ilma GitHub Issue'ta.**

1. Enne muudatusi leia või loo issue (`gh issue list` / `gh issue create`),
   milles on kirjeldus ja acceptance criteria; määra ennast täitjaks.
   Tüübid: feature (label `feature`), bug (label `bug`).
2. Sõnasta plaan enne koodi: mõjutatud moodulid, vajalikud muudatused.
3. Haru alati `main`-ist, nimi:
   - feature: `feature/<issue-nr>-nimi`
   - bugfix: `bugfix/<issue-nr>-nimi`
4. **Mitte kunagi ei commit'ita otse `main`-i.**
5. Commit-formaat: `#<issue-nr>: <lühikirjeldus>` — käskivas kõneviisis, alla
   72 tähemärgi, üks loogiline muudatus commit'i kohta.
6. **Atribueerimine:** mitte ühtegi Claude'i/AI viidet üheski GitHubi
   artefaktis — ei `Co-Authored-By: Claude`, ei "Generated with Claude Code"
   ega muid variatsioone. Commit'id, PR-id ja issue'd loevad nagu kasutaja
   enda kirjutatud. See on kõva reegel, mis trumpab tööriista vaikekäitumise.

**Merge on deploy-otsus, mitte automaatne samm:**

- Feature-haru elab seni, kuni **kasutaja** otsustab, et asi on valmis.
  "Töö tehtud" ≠ "merge'i kohe". AI **ei merge'i kunagi ilma kasutaja
  selgesõnalise loata**.
- Paralleelharud: üks issue/feature haru kohta, mitte kunagi segamini.
  Pooleliolev töö jääb oma harule (commit'itud ja push'itud) ega blokeeri
  teisi.
- Hoia avatud harud `main`-iga sünkroonis: merge'i `main` harru pärast
  `main`-i liikumist ja **alati enne merge-loa küsimist**. Konfliktid
  lahendatakse feature-harul, mitte kunagi `main`-il.

**Regressioonivärav (enne merge-loa küsimist):**

1. Sünki haru `main`-iga (konfliktid harus lahendatud)
2. Käivita kogu testikomplekt: `.venv/bin/pytest`
3. Kõik testid rohelised — eelnev punane test raporteeritakse, mitte ei
   ignoreerita

**Merge ise** (ainult pärast kasutaja luba) — squash, et `main`-i ajalugu
jääks puhas:

```bash
git checkout main
git pull origin main
git merge --squash <haru>
git commit -m "#<issue-nr>: <kokkuvõte>"
git push origin main
git branch -D <haru>   # squash katkestab ancestry, seega -D on siin õige
```

> **Tehniline tugi reeglitele:** juhisefail üksi `main`-i ei kaitse. Lisaks
> peaksid olema GitHubi **branch protection** (push `main`-i keelatud ilma
> rohelise kontrollita), **CI** (testid igal PR-il) ja **review**. Reegel
> "AI ei merge'i ilma loata" on käitumuslik kiht; branch protection on
> tehniline kiht sama eesmärgi jaoks.

---

## 6. Muudatuste ulatuse piiramine

- Muuda **ainult** issue'ga otseselt seotud faile.
- Ära refaktoori kõrvalist koodi — ka siis, kui see "jääks tee peale ette".
- Ära nimeta ümber avalikke route'e, JSON-väljade nimesid ega
  `data/stories.json` struktuuri ilma, et issue seda selgesõnaliselt nõuaks.
- **API ühilduvus:** olemasolevaid API-sid ei lõhuta. Breaking change vajab
  enne eraldi dokumenteeritud issue't.
- Kui lahendus nõuab rohkem kui ~5 faili muutmist, selgita enne põhjust —
  see on märk, et lahendus võib olla probleemist suurem.
- Üks issue = üks haru = üks fokusseeritud muudatuste komplekt. Kui töö
  käigus ilmneb eraldiseisev viga, loo sellele **uus issue**, ära paranda
  samas harus möödaminnes.

---

## 7. Turvalisus ja andmete kaitse

**Mitte kunagi:**

- ära commit'i saladusi, API-võtmeid, tokeneid ega paroole;
- ära hardcode'i credentiale;
- ära usalda kliendi sisendit — valideerimine toimub serveri pool
  (Pydantic mudelid `app/models.py` on selleks õige koht);
- ära logi tundlikke kasutajaandmeid;
- ära lülita kontrolli (valideerimist vms) välja selleks, et test läbiks.

**Alati:**

- saladused `.env` failis (mis on `.gitignore`'is), turvalised näidisväärtused
  `.env.example`'is;
- keskkonnaspetsiifiline käitumine `ENVIRONMENT`-muutuja kaudu; kui see on
  seadmata, eeldatakse **arenduskeskkonda**, mitte produktsiooni;
- lokaalne arendus töötab ilma produktsiooni-credentialiteta (selles
  projektis: failipõhine hoidla, mitte andmebaas).

---

## 8. Sõltuvuste lisamise reeglid

- Uut sõltuvust `requirements.txt`-i **ei lisata ilma põhjenduseta** — selgita
  enne, miks olemasolevatest (FastAPI, Pydantic, uvicorn, pytest, httpx) ei
  piisa.
- Kontrolli enne paketi lisamist, kas sama funktsionaalsus on projektis juba
  olemas.
- Frontend jääb sõltuvustevabaks vanilla JS-iks; ainus erand on juba kasutusel
  olev SortableJS CDN-ist. Mitte lisada npm-i ega package.json'it.
- Sõltuvuse lisamine on muudatus, mis vajab kasutaja kinnitust (vt ptk 10).

---

## 9. Kontrollnimekiri enne töö lõpetamist

Enne kui ütled, et töö on valmis:

- [ ] Issue acceptance criteria'd on kõik täidetud
- [ ] Haru on `main`-iga sünkroonitud (konfliktid harus lahendatud)
- [ ] `.venv/bin/pytest` — **kogu** komplekt roheline, mitte ainult uued testid
- [ ] Uuel funktsionaalsusel on testid; bugfix'il on regressioonitest, mis
      enne parandust ebaõnnestus
- [ ] `git diff main --stat` üle vaadatud: ainult issue'ga seotud failid
- [ ] Ühtegi saladust, võtit ega credentiali pole lisatud
- [ ] Commit'id formaadis `#<nr>: ...`, ilma AI-atribueerimiseta
- [ ] Dokumentatsioonimuudatused (README, `docs/`) on eesti keeles
- [ ] Kokkuvõte kasutajale: mis muutus, miks, ja millised failid
- [ ] Teata, et töö on **merge-valmis**, ja **oota kasutaja luba** — ära
      merge'i ise

Kui mõni punkt ebaõnnestub (nt test on punane), **ära kuuluta tööd valmis**
enne, kui põhjus on leitud ja parandatud või kasutajale raporteeritud.

---

## 10. Käitumine ebakindluse korral

Küsi kasutajalt enne tegutsemist, kui:

- acceptance criteria'd on ebaselged või mitmeti tõlgendatavad — **ära
  kunagi paku nõudeid peast**;
- on mitu mõistlikku implementatsioonistrateegiat — paku variandid koos
  soovitusega, ära vali vaikides;
- muudatus lõhuks ühilduvuse (API leping, `data/stories.json` struktuur,
  route'ide nimed);
- vaja oleks lisada uus sõltuvus, kustutada faile, muuta andmestruktuuri või
  teha turvalisusega seotud otsus.

Kui test ebaõnnestub ja põhjus on ebaselge: **raporteeri** ebaõnnestumine
koos väljundiga, ära "paranda" pakkumise peale. Kui nõue on mitmeti mõistetav:
paku enne koodi muutmist lühike plaan.

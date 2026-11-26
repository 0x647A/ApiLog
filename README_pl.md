# ApiLog: dziennik pasieki

**Języki:** [English](README.md) · Polski

ApiLog to aplikacja dla pszczelarza do zapisywania przeglądów uli. Zastępuje
papierowy zeszyt i trzyma całą historię każdego ula w jednym miejscu. Działa
offline na telefonie (jako PWA) i na podstawie zapisanych przeglądów daje
proste podpowiedzi i przypomnienia.

Backend to FastAPI i SQLite (SQLModel). Frontend to PWA w czystym JavaScripcie
z Service Workerem i IndexedDB, bez kroku budowania. Interfejs i rady są po
polsku i po angielsku.

## Co zapisuje przegląd

| Obszar | Pola | Dlaczego to ważne |
|---|---|---|
| Matka | widziana, tylko jaja, nie znaleziono, nieoznakowana | Świeże jaja oznaczają, że matka czerwiła w ostatnich ~3 dniach. Brak matki, jaj i larw może oznaczać bezmateczność. |
| Czerw | jaja, larwy, czerw kryty, wzorzec 1–5 | Zwarty czerw to zwykle dobra matka. Rozstrzelony może oznaczać problem z matką albo chorobę. |
| Rójka | spokój, zaczątki mateczników, nastrój rojowy; liczba mateczników | Mateczniki na krawędziach plastrów to sygnał, żeby działać przed rójką. |
| Rodzina | siła 1–10, obsiadane ramki, temperament | Pomaga zdecydować o poszerzeniu, nadstawkach albo łączeniu rodzin. |
| Zapasy | pokarm 0–5, pyłek 0–5 | Niskie zapasy to ryzyko głodu. |
| Zdrowie | metoda i wynik badania na warrozę, objawy chorób | Warroza to główna przyczyna upadków rodzin. |
| Czynności | leczenie, karmienie, odebrany miód | Historia zabiegów, np. żeby pilnować karencji. |
| Kontekst | data, pogoda, temperatura, notatki, do zrobienia | Notatki na następną wizytę. |

Źródła pól: [Foxhound Bee Co.](https://www.foxhoundbeecompany.com/blogs/all-our-posts/bee-hive-inspection-checklist-and-record-keeping),
[HiveSense](https://tryhivesense.com/blog/hive-inspection-checklist),
[Pasieka24](https://pasieka24.pl/index.php/pl-pl/biblioteczka-pszczelarza-z-pasja-ksiazki-pasieki/81-wspolczesna-gospodarka-pasieczna-tom-1/860-3-organizacja-prowadzenia-pasieki).

## Funkcje

- Pasieki, ule i przeglądy: dodawanie, edycja (pasieki i ule), lista
  i usuwanie. Usunięcie pasieki lub ula usuwa też jego przeglądy, po
  potwierdzeniu. Usuwanie działa również offline.
- **Uwagi** (`/api/alerts`) liczone na serwerze z ostatniego przeglądu każdego
  aktywnego ula:
  - brak przeglądu od 14 dni lub dłużej,
  - brak matki, jaj i larw,
  - nastrój rojowy albo mateczniki,
  - słaby wzorzec czerwiu (2/5 lub mniej),
  - niskie zapasy pokarmu (1/5 lub mniej),
  - wysoki poziom warrozy (patrz niżej),
  - zapisane objawy chorób.
- **Rady po przeglądzie** liczone w przeglądarce (także offline) z sugerowaną
  datą następnego przeglądu. Rady zapisują się razem z przeglądem, więc widać je
  potem w historii ula.
- **Zakładka „Wiedza”** z cyklem rozwoju matki, robotnicy i trutnia oraz
  zadaniami robotnicy w zależności od wieku. Jest też ciekawostka dnia.

**Reguła warrozy:** uwaga i rada biorą pod uwagę tylko wyniki z cukru pudru
i smyku alkoholowego. Trzy lub więcej roztoczy w próbce ok. 300 pszczół
(ok. 1%) daje ostrzeżenie. Wyniki z wkładki dennicowej i czerwiu trutowego są
zapisywane, ale aplikacja ich nie ocenia, bo mają inne jednostki.

Rady są ogólne. Nie zastępują doświadczonego pszczelarza ani lekarza
weterynarii. Źródła rad: [Koło Pszczelarzy](https://kolo-pszczelarzy.pl/porady-bogdana/rojka-zapobieganie-i-wykorzystanie/),
[pasiecznik.pl](https://pasiecznik.pl/biologia),
[Portal Pszczelarski](https://www.portalpszczelarski.pl/artykul/146/pszczoly_robotnice_i_ich_funkcje_w_rodzinie_pszczelej.html).

## Jak działa tryb offline

- Service Worker zapisuje pliki aplikacji w pamięci podręcznej, więc aplikacja
  otwiera się bez sieci.
- Nowe dane zapisują się najpierw w IndexedDB, a potem trafiają do kolejki.
- Gdy wraca sieć, kolejka jest wysyłana na serwer w oryginalnej kolejności.
  Rekordy utworzone offline dostają tymczasowe ID, które po zapisie zamienia się
  na ID z serwera. Każdy przegląd ma `client_uuid`, więc ponowne wysłanie nie
  tworzy duplikatu.
- Jeśli serwer odrzuci zmianę (np. błędne dane), zmiana jest usuwana z kolejki,
  a aplikacja pokazuje komunikat. Dzięki temu reszta kolejki dalej się wysyła.

## Uruchomienie

Potrzebujesz [uv](https://docs.astral.sh/uv/) i Pythona 3.11 lub nowszego.

```bash
uv sync          # instalacja zależności (raz potrzebny internet)
uv run apilog    # start serwera
```

Możesz też użyć `./run.sh`. Potem otwórz <http://localhost:8000>.

Bez uv:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Dane są w pliku `apilog.db` (SQLite). Kopia zapasowa to po prostu kopia tego pliku.

### Używanie na telefonie

Domyślnie serwer słucha tylko na `127.0.0.1`. Aplikacja **nie ma logowania**,
więc każdy, kto ma dostęp do serwera, może czytać i zmieniać dane. Jeśli chcesz
używać jej na telefonie w domowej sieci Wi-Fi, uruchom:

```bash
HOST=0.0.0.0 uv run apilog
```

i otwórz `http://IP-TWOJEGO-KOMPUTERA:8000`. Przeglądarki włączają Service
Workera tylko na `https://` albo `http://localhost`, więc do trybu offline na
telefonie potrzebujesz HTTPS, np. reverse proxy (Caddy) z certyfikatem.

## Testy

```bash
uv run pytest
```

Testy używają tymczasowej bazy, a nie `apilog.db`. Uruchamiają się też
automatycznie w GitHub Actions przy każdym pushu do `main` i przy pull requestach.

## API

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET`, `POST` | `/api/apiaries` | Lista lub dodanie pasieki |
| `PUT`, `DELETE` | `/api/apiaries/{id}` | Edycja lub usunięcie pasieki (razem z ulami i przeglądami) |
| `GET`, `POST` | `/api/hives?apiary_id=` | Lista lub dodanie ula |
| `GET`, `PUT`, `DELETE` | `/api/hives/{id}` | Szczegóły, edycja lub usunięcie ula |
| `GET`, `POST` | `/api/inspections?hive_id=` | Lista lub dodanie przeglądu |
| `DELETE` | `/api/inspections/{id}` | Usunięcie przeglądu |
| `GET` | `/api/alerts` | Uwagi dla aktywnych uli |

Swagger UI (`/docs`) jest wyłączony, bo ładuje pliki z CDN, a polityka CSP
aplikacji to blokuje. Schemat jest pod `/openapi.json`.

## Struktura projektu

```
app/
  main.py           aplikacja FastAPI, routery, middleware
  __main__.py       punkt wejścia dla `uv run apilog`
  models.py         modele bazy i enumy
  schemas.py        walidacja danych wejściowych
  crud.py           wspólne funkcje bazodanowe
  db.py             połączenie z SQLite
  security.py       nagłówki bezpieczeństwa (CSP)
  alerts_engine.py  reguły uwag
  routers/          endpointy API
  static/           PWA: index.html, app.js, i18n.js, knowledge.js, sw.js
tests/              testy API i reguł
```

## Bezpieczeństwo

- Wszystkie zapytania do bazy idą przez SQLModel (zapytania parametryzowane).
- Frontend tworzy tekst przez `createTextNode`, nigdy przez `innerHTML` z danymi użytkownika.
- Każda odpowiedź ma nagłówki bezpieczeństwa i restrykcyjną CSP (`script-src 'self'`).
- Dane wejściowe są walidowane przez Pydantic (zakresy wartości i maksymalna długość tekstu).

## Ograniczenia

- Brak kont użytkowników. Aplikacja jest dla jednej osoby w prywatnej sieci.
- Uwagi są liczone na serwerze, więc offline mogą być nieaktualne.

## Licencja

MIT, zobacz [LICENSE](LICENSE).

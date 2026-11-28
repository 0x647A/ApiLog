# ApiLog: apiary logbook

**Languages:** English · [Polski](README.pl.md)

ApiLog is an app for beekeepers to record hive inspections. It replaces a
paper notebook and keeps the full history of every hive in one place. The app
works offline on a phone (as a PWA) and gives simple suggestions and reminders
based on the saved inspections.

The backend uses FastAPI and SQLite (SQLModel). The frontend is a PWA written in
plain JavaScript with a Service Worker and IndexedDB, so there is no build step.
The interface and the advice are in Polish and English.

## What an inspection records

| Area | Fields | Why it matters |
|---|---|---|
| Queen | seen, eggs only, not found, unmarked | Fresh eggs mean the queen laid in the last ~3 days. No queen, eggs or larvae may mean the colony is queenless. |
| Brood | eggs, larvae, capped brood, pattern 1 to 5 | A solid pattern usually means a good queen. A spotty pattern can mean a queen problem or disease. |
| Swarming | calm, queen cells starting, swarming; number of queen cells | Queen cells on the comb edges are a sign to act before the colony swarms. |
| Colony | strength 1 to 10, frames of bees, temperament | Helps to decide about more space, supers or uniting colonies. |
| Stores | food 0 to 5, pollen 0 to 5 | Low stores mean a risk of starvation. |
| Health | varroa test method and result, disease signs | Varroa is the main cause of colony losses. |
| Actions | treatment, feeding, honey harvested | A history of what you did, for example to respect withdrawal periods. |
| Context | date, weather, temperature, notes, to do next time | Notes for the next visit. |

Sources for the fields: [Foxhound Bee Co.](https://www.foxhoundbeecompany.com/blogs/all-our-posts/bee-hive-inspection-checklist-and-record-keeping),
[HiveSense](https://tryhivesense.com/blog/hive-inspection-checklist),
[Pasieka24](https://pasieka24.pl/index.php/pl-pl/biblioteczka-pszczelarza-z-pasja-ksiazki-pasieki/81-wspolczesna-gospodarka-pasieczna-tom-1/860-3-organizacja-prowadzenia-pasieki).

## Features

- Apiaries, hives and inspections: add, edit (apiaries and hives), list and
  delete. Deleting an apiary or a hive also deletes its inspections, after a
  confirmation. Deleting works offline too.
- **Alerts** (`/api/alerts`), calculated on the server from the latest
  inspection of each active hive:
  - no inspection for 14 days or more,
  - no queen, no eggs and no larvae,
  - swarming signs or queen cells,
  - poor brood pattern (2/5 or less),
  - low food stores (1/5 or less),
  - high varroa level (see below),
  - disease signs written in the inspection.
- **Advice after an inspection**, calculated in the browser (also offline),
  with a suggested date for the next inspection. The advice is saved with the
  inspection, so you can see it later in the hive history.
- **Knowledge tab** with the development cycle of the queen, worker and drone,
  and the tasks of a worker bee by age. There is also a bee fact of the day.

**Varroa rule:** the alert and the advice use only sugar roll and alcohol wash
results. Three or more mites in a sample of about 300 bees (about 1%) gives a
warning. Sticky board and drone brood counts are saved, but the app does not
evaluate them, because they use different units.

The advice is general. It does not replace an experienced beekeeper or a vet.
Advice sources: [Koło Pszczelarzy](https://kolo-pszczelarzy.pl/porady-bogdana/rojka-zapobieganie-i-wykorzystanie/),
[pasiecznik.pl](https://pasiecznik.pl/biologia),
[Portal Pszczelarski](https://www.portalpszczelarski.pl/artykul/146/pszczoly_robotnice_i_ich_funkcje_w_rodzinie_pszczelej.html).

## How offline mode works

- The Service Worker caches the app files, so the app opens without a network.
- New data is saved first in IndexedDB and then added to a queue.
- When the network is back, the queue is sent to the server in the original
  order. Records created offline get a temporary ID, which is replaced with the
  server ID after saving. Each inspection has a `client_uuid`, so sending it
  twice does not create a duplicate.
- If the server rejects a change (for example invalid data), the change is
  removed from the queue and the app shows a message, so the rest of the queue
  can still be sent.

## How to run

You need [uv](https://docs.astral.sh/uv/) and Python 3.11 or newer.

```bash
uv sync          # install dependencies (needs internet once)
uv run apilog    # start the server
```

You can also use `./run.sh`. Then open <http://localhost:8000>.

Without uv:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The data is stored in `apilog.db` (SQLite). To make a backup, copy this file.

### Using it on a phone

By default the server listens only on `127.0.0.1`. The app has **no login**, so
anyone who can reach the server can read and change the data. If you want to
use it on a phone in your home Wi-Fi, start it with:

```bash
HOST=0.0.0.0 uv run apilog
```

and open `http://YOUR-COMPUTER-IP:8000`. Browsers turn on the Service Worker
only on `https://` or `http://localhost`, so for offline mode on a phone you
need HTTPS, for example a reverse proxy like Caddy with a certificate.

## Tests

```bash
uv run pytest
```

The tests use a temporary database, not `apilog.db`. They also run in GitHub
Actions on every push to `main` and on pull requests.

## API

| Method | Path | Description |
|---|---|---|
| `GET`, `POST` | `/api/apiaries` | List or create apiaries |
| `PUT`, `DELETE` | `/api/apiaries/{id}` | Edit or delete an apiary (with its hives and inspections) |
| `GET`, `POST` | `/api/hives?apiary_id=` | List or create hives |
| `GET`, `PUT`, `DELETE` | `/api/hives/{id}` | Get, edit or delete a hive |
| `GET`, `POST` | `/api/inspections?hive_id=` | List or create inspections |
| `DELETE` | `/api/inspections/{id}` | Delete an inspection |
| `GET` | `/api/alerts` | Alerts for active hives |

Swagger UI (`/docs`) is turned off, because it loads files from a CDN and the
app's Content Security Policy blocks that. The schema is at `/openapi.json`.

## Project structure

```
app/
  main.py           FastAPI app, routers, middleware
  __main__.py       entry point for `uv run apilog`
  models.py         database models and enums
  schemas.py        input validation
  crud.py           shared database helpers
  db.py             SQLite connection
  security.py       security headers (CSP)
  alerts_engine.py  alert rules
  routers/          API endpoints
  static/           PWA: index.html, app.js, i18n.js, knowledge.js, sw.js
tests/              API and alert tests
```

## Security

- All database queries go through SQLModel (parameterised queries).
- The frontend creates text with `createTextNode`, never `innerHTML` with user data.
- Every response has security headers and a strict CSP (`script-src 'self'`).
- Input is validated with Pydantic (value ranges and maximum text length).

## Limitations

- No user accounts. The app is meant for one person on a private network.
- Alerts are calculated on the server, so offline they can be out of date.
- The code comments are in Polish.

## License

MIT, see [LICENSE](LICENSE).

# Likes backend

FastAPI + SQLite backend for the Share / Like controls on the writing pages.

## Run locally

From this `backend` folder:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`.

The frontend already points to that address by default. To use another backend URL, define `window.WRITINGS_API_URL` before `reactions.js` loads.

## Endpoints

- `GET /api/health`
- `GET /api/writings/{slug}/likes?client_id=...`
- `POST /api/writings/{slug}/like`
- `DELETE /api/writings/{slug}/like`

Likes are anonymous and identified by a browser-generated client UUID. The global count is stored in SQLite, so all devices using the same backend see the same total count.

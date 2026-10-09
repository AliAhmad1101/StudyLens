# StudyLens Backend

## Setup (Windows PowerShell)

1. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```

## Seed Database (Optional)
To populate the database with dummy data for testing:
```powershell
$env:PYTHONPATH="."
python seed.py
```

## Running the Application

```powershell
$env:PYTHONPATH="."
uvicorn app.main:app --reload
```
- API is available at http://127.0.0.1:8000
- Interactive docs available at http://127.0.0.1:8000/docs

## Running Tests

```powershell
$env:PYTHONPATH="."
pytest
```

## Endpoints

*   **Students**: `GET /students`, `POST /students`, `GET /students/{id}`, `PATCH /students/{id}`, `DELETE /students/{id}`
*   **Resources**: `GET /resources`, `POST /resources`, `GET /resources/{id}`, `PATCH /resources/{id}`, `DELETE /resources/{id}`
*   **Quizzes**: `POST /quizzes/generate`, `GET /quizzes/{id}`, `POST /students/{id}/quiz-attempts`, `GET /students/{id}/quiz-attempts`
*   **Recommendations**: `GET /students/{id}/recommendations`

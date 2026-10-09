import pytest

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_profile_crud_and_invalid(client):
    # GET (should create default profile)
    res = client.get("/api/profile")
    assert res.status_code == 200
    assert res.json()["fullName"] == ""
    
    # PUT valid
    res2 = client.put("/api/profile", json={
        "fullName": "Aarav Mehta",
        "email": "a@b.com",
        "grade": "Class 11",
        "goal": "Crack",
        "availableMin": 90,
        "learnersType": "mixing",
        "notesPref": "examples",
        "level": "intermediate",
        "subjects": ["physics"],
        "focusSubject": "physics",
        "streakDays": 3,
        "quizCount": 5,
        "quizScores": [80],
        "weakTopics": ["Electromagnetism"],
        "conceptsLearned": 12
    })
    assert res2.status_code == 200
    assert res2.json()["fullName"] == "Aarav Mehta"
    assert res2.json()["subjects"] == ["physics"]
    
    # PUT with missing fields (should use defaults from pydantic if possible, or raise 422 if required)
    # Actually, all fields in Profile have defaults except if they were strictly required.
    # We gave them all `default=` in schemas.py, so an empty JSON works.
    res3 = client.put("/api/profile", json={})
    assert res3.status_code == 200
    assert res3.json()["fullName"] == ""
    assert res3.json()["level"] == "beginner"

    # PUT invalid data type
    res4 = client.put("/api/profile", json={"availableMin": "not-an-int"})
    assert res4.status_code == 422

def test_resources_filtering(client):
    # Setup some resources using the old /resources endpoint (kept for seeding/tests)
    r1 = client.post("/api/resources", json={
        "title": "Physics Video",
        "description": "Test",
        "subject": "physics",
        "topic": "Mechanics",
        "resource_type": "video",
        "difficulty": "beginner",
        "url": "http://test.com/1"
    })
    assert r1.status_code == 200, r1.text
    r2 = client.post("/api/resources", json={
        "title": "Math Article",
        "description": "Test",
        "subject": "maths",
        "topic": "Algebra",
        "resource_type": "article",
        "difficulty": "advanced",
        "url": "http://test.com/2"
    })
    assert r2.status_code == 200, r2.text

    client.put("/api/profile", json={
        "subjects": ["physics"],
        "level": "beginner"
    })

    # Fetch resources for physics
    res = client.get("/api/subjects/physics/resources")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["type"] == "video"
    assert data[0]["link"] == "http://test.com/1"
    assert "_score" in data[0]

    # Fetch for unknown subject (should be empty)
    res2 = client.get("/api/subjects/unknown/resources")
    assert res2.status_code == 200
    assert len(res2.json()) == 0

def test_quiz_generation_and_submission(client):
    # Get Quiz for physics
    quiz_res = client.get("/api/subjects/physics/quiz")
    assert quiz_res.status_code == 200
    quiz = quiz_res.json()
    assert quiz["topic"] == "physics"
    assert len(quiz["questions"]) > 0
    
    # Verify answers are hidden
    for q in quiz["questions"]:
        assert "correct_answer" not in q
        assert "options" in q
    
    q1_id = quiz["questions"][0]["id"]

    q2_id = quiz["questions"][1]["id"]
    submit_res = client.post("/api/quiz/submit", json={
        "subjectKey": "physics",
        "timeTakenSec": 120,
        "answers": [
            {"q": q1_id, "chosen": "Option A", "topic": "Mechanics"},
            {"q": q2_id, "chosen": "Wrong", "topic": "Mechanics"}
        ]
    })
    assert submit_res.status_code == 200
    res_data = submit_res.json()
    assert res_data["scorePct"] == 50.0  # 1 out of 2 correct (since quiz has 2 questions)
    assert "Mechanics" in res_data["weakTopics"]
    
    # Submit Quiz (Incorrect)
    submit_res2 = client.post("/api/quiz/submit", json={
        "subjectKey": "physics",
        "answers": [{"q": q1_id, "chosen": "WrongOption", "topic": "Electromagnetism"}]
    })
    assert submit_res2.status_code == 200
    assert submit_res2.json()["scorePct"] == 0.0
    assert "Electromagnetism" in submit_res2.json()["weakTopics"]

    # Submit Quiz with invalid answer structure (q id doesn't exist)
    submit_res3 = client.post("/api/quiz/submit", json={
        "subjectKey": "physics",
        "answers": [{"q": 999999, "chosen": "Option A", "topic": "Mechanics"}]
    })
    assert submit_res3.status_code == 200 # It just counts it as wrong if id is invalid in current logic
    assert submit_res3.json()["scorePct"] == 0.0

    # Submit empty answers
    submit_res4 = client.post("/api/quiz/submit", json={
        "subjectKey": "physics",
        "answers": []
    })
    assert submit_res4.status_code == 200
    assert submit_res4.json()["scorePct"] == 0.0

def test_stats_and_unimplemented_endpoints(client):
    # Stats with no attempts
    res = client.get("/api/stats")
    assert res.status_code == 200
    assert "streakDays" in res.json()
    
    # Quiz history
    res2 = client.get("/api/quiz/1/history")
    assert res2.status_code == 200
    assert isinstance(res2.json(), list)

    # Study plan
    res3 = client.post("/api/study-plan", json={
        "availableMin": 60,
        "weakTopics": ["Mechanics"],
        "goal": "Score well"
    })
    assert res3.status_code == 200
    assert isinstance(res3.json(), list)

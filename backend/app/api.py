from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app import schemas, models
from app.database import get_db
from app.adapters import MockAIAdapter
import json
from datetime import datetime

router = APIRouter(prefix="/api")

@router.get("/health", response_model=schemas.HealthResponse)
def health_check():
    return schemas.HealthResponse(status="ok")

def _get_or_create_student(db: Session) -> models.Student:
    student = db.query(models.Student).first()
    if not student:
        student = models.Student(
            name="",
            email="",
            grade="",
            learning_goals="",
            available_study_time=60,
            learners_type="mixing",
            notes_pref="detailed",
            current_knowledge_level="beginner",
            subjects="[]",
            focus_subject="",
            quiz_scores="[]",
            weak_topics="[]"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

@router.get("/profile", response_model=schemas.Profile)
def get_profile(db: Session = Depends(get_db)):
    student = _get_or_create_student(db)
    
    try:
        subjects = json.loads(student.subjects)
    except:
        subjects = []
    try:
        quiz_scores = json.loads(student.quiz_scores)
    except:
        quiz_scores = []
    try:
        weak_topics = json.loads(student.weak_topics)
    except:
        weak_topics = []

    return schemas.Profile(
        fullName=student.name,
        email=student.email,
        grade=student.grade,
        goal=student.learning_goals,
        availableMin=student.available_study_time,
        learnersType=student.learners_type,
        notesPref=student.notes_pref,
        level=student.current_knowledge_level,
        subjects=subjects,
        focusSubject=student.focus_subject,
        streakDays=student.streak_days,
        quizCount=student.quiz_count,
        quizScores=quiz_scores,
        weakTopics=weak_topics,
        conceptsLearned=student.concepts_learned
    )

@router.put("/profile", response_model=schemas.Profile)
def update_profile(profile: schemas.Profile, db: Session = Depends(get_db)):
    student = _get_or_create_student(db)
    
    student.name = profile.fullName
    student.email = profile.email
    student.grade = profile.grade
    student.learning_goals = profile.goal
    student.available_study_time = profile.availableMin
    student.learners_type = profile.learnersType
    student.notes_pref = profile.notesPref
    student.current_knowledge_level = profile.level
    student.subjects = json.dumps(profile.subjects)
    student.focus_subject = profile.focusSubject
    student.streak_days = profile.streakDays
    student.quiz_count = profile.quizCount
    student.quiz_scores = json.dumps(profile.quizScores)
    student.weak_topics = json.dumps(profile.weakTopics)
    student.concepts_learned = profile.conceptsLearned
    
    db.commit()
    db.refresh(student)
    return get_profile(db)

@router.get("/subjects/{subject_key}/resources", response_model=List[Dict[str, Any]])
def get_ranked_resources(subject_key: str, db: Session = Depends(get_db)):
    student = _get_or_create_student(db)
    attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.student_id == student.id).all()
    
    resources = db.query(models.LearningResource).filter(models.LearningResource.subject == subject_key).all()
    
    ranked = MockAIAdapter.rank_resources(student, resources, attempts)
    
    out = []
    for r in ranked:
        res = r["resource"]
        out.append({
            "id": res.id,
            "title": res.title,
            "topic": res.topic,
            "detail": res.description,
            "type": res.resource_type,
            "link": res.url,
            "level": res.difficulty,
            "_score": r["match_score"],
            "_reason": r["reasons"]
        })
    return out

@router.get("/subjects/{subject_key}/quiz", response_model=schemas.QuizResponse)
def get_subject_quiz(subject_key: str, db: Session = Depends(get_db)):
    student = _get_or_create_student(db)
    # create quiz
    db_quiz = models.Quiz(topic=subject_key, difficulty=student.current_knowledge_level)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    questions_data = MockAIAdapter.generate_quiz_data(subject_key, student.current_knowledge_level)
    for q_data in questions_data:
        db_q = models.QuizQuestion(
            quiz_id=db_quiz.id,
            question_text=q_data["question_text"],
            options=q_data["options"],
            correct_answer=q_data["correct_answer"]
        )
        db.add(db_q)
        
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@router.post("/quiz/submit", response_model=schemas.QuizSubmitResponse)
def submit_quiz_attempt(submission: schemas.QuizSubmitRequest, db: Session = Depends(get_db)):
    student = _get_or_create_student(db)
    
    correct_count = 0
    total = len(submission.answers)
    weak_topics = set()
    
    # Check answers against DB
    for ans in submission.answers:
        q_id = ans.get("q")
        chosen = ans.get("chosen")
        topic = ans.get("topic", submission.subjectKey)
        
        q_db = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == q_id).first()
        is_correct = False
        if q_db and q_db.correct_answer:
            if str(chosen).strip().lower() == str(q_db.correct_answer).strip().lower():
                is_correct = True
        
        if is_correct:
            correct_count += 1
        else:
            weak_topics.add(topic)
            
    scorePct = (correct_count / total * 100.0) if total > 0 else 0.0
    
    db_attempt = models.QuizAttempt(
        student_id=student.id,
        topic=submission.subjectKey,
        score=scorePct,
        difficulty=student.current_knowledge_level
    )
    db.add(db_attempt)
    db.commit()
    
    return schemas.QuizSubmitResponse(
        scorePct=scorePct,
        level=student.current_knowledge_level, # to be blended later
        weakTopics=list(weak_topics),
        timeTakenSec=submission.timeTakenSec
    )

@router.get("/quiz/{quiz_id}/history")
def get_quiz_history(quiz_id: int, db: Session = Depends(get_db)):
    # Mock return for history.
    return []

@router.post("/study-plan", response_model=List[schemas.StudyPlanStep])
def generate_study_plan(req: schemas.StudyPlanRequest, db: Session = Depends(get_db)):
    # Mock returning study plan based on requested JSON.
    return []

@router.get("/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    student = _get_or_create_student(db)
    return schemas.StatsResponse(
        streakDays=student.streak_days,
        conceptsLearned=student.concepts_learned,
        quizCount=student.quiz_count
    )

# Adding seed endpoints back if tests needed them (e.g. for resources)
@router.post("/resources", response_model=schemas.LearningResourceResponse)
def create_resource(resource: schemas.LearningResourceCreate, db: Session = Depends(get_db)):
    db_resource = models.LearningResource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

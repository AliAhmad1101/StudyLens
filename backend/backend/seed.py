from app.database import init_db, SessionLocal
from app.models import Student, LearningResource, QuizAttempt

def seed():
    init_db()
    db = SessionLocal()
    
    if db.query(Student).first():
        print("Database already seeded.")
        return

    student = Student(
        name="Alice",
        subjects="Math, Science",
        topics="Algebra, Physics",
        learning_goals="Pass final exams",
        preferred_resource_types="video, practice",
        available_study_time=120
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    resource1 = LearningResource(
        title="Algebra Basics",
        description="Introduction to Algebra",
        subject="Math",
        topic="Algebra",
        resource_type="video",
        difficulty="beginner",
        url="http://example.com/algebra"
    )
    resource2 = LearningResource(
        title="Advanced Physics Practice",
        description="Physics problems",
        subject="Science",
        topic="Physics",
        resource_type="practice",
        difficulty="advanced",
        url="http://example.com/physics"
    )
    db.add_all([resource1, resource2])
    db.commit()

    from app.models import Quiz
    quiz = Quiz(topic="Algebra", difficulty="beginner")
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    attempt = QuizAttempt(
        student_id=student.id,
        quiz_id=quiz.id,
        topic="Algebra",
        difficulty="beginner",
        score=65.0
    )
    db.add(attempt)
    db.commit()

    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()

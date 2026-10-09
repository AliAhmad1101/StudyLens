from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, default="")
    grade = Column(String, default="")
    subjects = Column(String, default="[]")
    topics = Column(String, default="")
    learning_goals = Column(String, default="")
    preferred_resource_types = Column(String, default="")
    available_study_time = Column(Integer, default=60)
    learners_type = Column(String, default="mixing")
    notes_pref = Column(String, default="detailed")
    current_knowledge_level = Column(String, default="beginner")
    target_level = Column(String, default="advanced")
    focus_subject = Column(String, default="")
    streak_days = Column(Integer, default=0)
    quiz_count = Column(Integer, default=0)
    quiz_scores = Column(String, default="[]")
    weak_topics = Column(String, default="[]")
    concepts_learned = Column(Integer, default=0)

class LearningResource(Base):
    __tablename__ = "learning_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    subject = Column(String, index=True)
    topic = Column(String, index=True)
    resource_type = Column(String)
    difficulty = Column(String)
    url = Column(String)

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    difficulty = Column(String)
    
    questions = relationship("QuizQuestion", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(String)
    options = Column(String)
    correct_answer = Column(String)
    
    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)
    topic = Column(String, index=True)
    difficulty = Column(String, nullable=True)
    score = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

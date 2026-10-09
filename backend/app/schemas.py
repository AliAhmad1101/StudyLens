import json
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str

class Profile(BaseModel):
    fullName: str = Field(default="")
    email: str = Field(default="")
    grade: str = Field(default="")
    goal: str = Field(default="")
    availableMin: int = Field(default=60)
    learnersType: str = Field(default="mixing")
    notesPref: str = Field(default="detailed")
    level: str = Field(default="beginner")
    subjects: List[str] = Field(default_factory=list)
    focusSubject: str = Field(default="")
    streakDays: int = Field(default=0)
    quizCount: int = Field(default=0)
    quizScores: List[int] = Field(default_factory=list)
    weakTopics: List[str] = Field(default_factory=list)
    conceptsLearned: int = Field(default=0)
    updatedAt: Optional[str] = None
    createdAt: Optional[str] = None

class LearningResourceBase(BaseModel):
    title: str
    description: str
    subject: str
    topic: str
    resource_type: str
    difficulty: str
    url: str

class LearningResourceCreate(LearningResourceBase):
    pass

class LearningResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    resource_type: Optional[str] = None
    difficulty: Optional[str] = None
    url: Optional[str] = None

class LearningResourceResponse(LearningResourceBase):
    id: int
    type: Optional[str] = None # mapped from resource_type
    link: Optional[str] = None # mapped from url
    detail: Optional[str] = None # mapped from description

    model_config = ConfigDict(from_attributes=True)

class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    options: List[str]

    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    model_config = ConfigDict(from_attributes=True)

class QuizResponse(BaseModel):
    id: int
    topic: str
    difficulty: str
    questions: List[QuizQuestionResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class QuizSubmitRequest(BaseModel):
    subjectKey: str
    timeTakenSec: Optional[int] = 0
    answers: List[Dict[str, Any]] # e.g. [{"q": "q_id", "chosen": "A", "topic": "Mechanics"}]

class QuizSubmitResponse(BaseModel):
    scorePct: float
    level: str
    weakTopics: List[str]
    timeTakenSec: int

class StudyPlanRequest(BaseModel):
    availableMin: int
    weakTopics: List[str]
    goal: str

class StudyPlanStep(BaseModel):
    subjectKey: str
    title: str
    detail: str
    min: int

class StatsResponse(BaseModel):
    streakDays: int
    conceptsLearned: int
    quizCount: int

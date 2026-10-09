from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models import Base
    from sqlalchemy import text
    
    Base.metadata.create_all(bind=engine)
    
    if settings.database_url.startswith("sqlite"):
        with engine.begin() as conn:
            res = conn.execute(text("PRAGMA table_info(students)")).fetchall()
            if res:
                cols = [r[1] for r in res]
                new_cols = {
                    'email': "VARCHAR DEFAULT ''",
                    'grade': "VARCHAR DEFAULT ''",
                    'learners_type': "VARCHAR DEFAULT 'mixing'",
                    'notes_pref': "VARCHAR DEFAULT 'detailed'",
                    'focus_subject': "VARCHAR DEFAULT ''",
                    'streak_days': "INTEGER DEFAULT 0",
                    'quiz_count': "INTEGER DEFAULT 0",
                    'quiz_scores': "VARCHAR DEFAULT '[]'",
                    'weak_topics': "VARCHAR DEFAULT '[]'",
                    'concepts_learned': "INTEGER DEFAULT 0",
                    'current_knowledge_level': "VARCHAR DEFAULT 'beginner'",
                    'target_level': "VARCHAR DEFAULT 'advanced'"
                }
                for cname, ctype in new_cols.items():
                    if cname not in cols:
                        conn.execute(text(f"ALTER TABLE students ADD COLUMN {cname} {ctype}"))
            res = conn.execute(text("PRAGMA table_info(quiz_attempts)")).fetchall()
            if res:
                cols = [r[1] for r in res]
                if 'quiz_id' not in cols:
                    conn.execute(text("ALTER TABLE quiz_attempts ADD COLUMN quiz_id INTEGER"))
                if 'difficulty' not in cols:
                    conn.execute(text("ALTER TABLE quiz_attempts ADD COLUMN difficulty VARCHAR"))

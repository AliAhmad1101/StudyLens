import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# We will run this script to ensure the existing studylens.db can be migrated
# and successfully queried.

from app.database import init_db, SessionLocal
from app.main import app

def verify():
    print("Running migration...")
    init_db() # This will run our ALTER TABLE logic on studylens.db

    print("Migration complete. Verifying POST /students works on migrated database...")
    
    with TestClient(app) as client:
        response = client.post("/students", json={
            "name": "Migration Test Student",
            "subjects": "Math",
            "topics": "Algebra",
            "learning_goals": "Learn",
            "preferred_resource_types": "video",
            "available_study_time": 60,
            "current_knowledge_level": "intermediate",
            "target_level": "expert"
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Student created with ID: {data['id']}")
            print(f"current_knowledge_level: {data['current_knowledge_level']}")
            print(f"target_level: {data['target_level']}")
        else:
            print(f"Failed! Status: {response.status_code}, Body: {response.text}")
            exit(1)

if __name__ == "__main__":
    verify()

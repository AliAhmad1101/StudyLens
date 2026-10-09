import json
from typing import List, Dict, Any, Set

class MockAIAdapter:
    """
    Adapter defining the integration contract for the future AI teammate.
    This separates the backend application logic from the LLM generation logic.
    """
    
    @staticmethod
    def generate_quiz_data(topic: str, difficulty: str) -> List[Dict[str, Any]]:
        """
        AI CONTRACT: Generate Quiz
        Input: 
          - topic (str): The subject or topic area.
          - difficulty (str): The target difficulty (e.g., 'beginner', 'intermediate', 'advanced').
        
        Output:
          A list of dictionaries, each representing a question.
          Each dictionary must contain:
            - "question_text" (str): The text of the question.
            - "options" (str): A JSON-encoded list of strings for the multiple-choice options.
            - "correct_answer" (str): The exact string of the correct option.
        """
        return [
            {
                "question_text": f"What is the foundational concept of {topic}?",
                "options": json.dumps(["Option A", "Option B", "Option C", "Option D"]),
                "correct_answer": "Option A"
            },
            {
                "question_text": f"How do you apply {topic} in practice?",
                "options": json.dumps(["Method X", "Method Y", "Method Z"]),
                "correct_answer": "Method Y"
            }
        ]
        
    @staticmethod
    def rank_resources(student, resources, attempts) -> List[Dict[str, Any]]:
        """
        AI CONTRACT: Rank Resources
        Input:
          - student: The ORM Student model.
          - resources: A list of ORM LearningResource models.
          - attempts: A list of ORM QuizAttempt models for the student.
          
        Output:
          A sorted list of dictionaries representing recommendations, descending by match_score.
          Each dict contains:
            - "resource": The LearningResource object.
            - "match_score": Integer or float score.
            - "reasons": A concise string explaining why it was recommended.
        """
        topic_scores: Dict[str, List[float]] = {}
        for att in attempts:
            t = att.topic.lower().strip()
            if t not in topic_scores:
                topic_scores[t] = []
            topic_scores[t].append(att.score)
        
        weak_topics: Set[str] = set()
        strong_topics: Set[str] = set()
        
        for t, scores in topic_scores.items():
            avg_score = sum(scores) / len(scores)
            if avg_score < 70:
                weak_topics.add(t)
            elif avg_score >= 70 and len(scores) >= 2:
                strong_topics.add(t)
                    
        try:
            student_subjects = [s.strip().lower() for s in json.loads(student.subjects)]
        except Exception:
            student_subjects = [s.strip().lower() for s in student.subjects.split(",") if s.strip()]
            
        try:
            student_topics = [t.strip().lower() for t in json.loads(student.topics)]
        except Exception:
            student_topics = [t.strip().lower() for t in student.topics.split(",") if t.strip()]
            
        try:
            student_pref_types = [r.strip().lower() for r in json.loads(student.preferred_resource_types)]
        except Exception:
            student_pref_types = [r.strip().lower() for r in student.preferred_resource_types.split(",") if r.strip()]

        
        recommendations = []
        for resource in resources:
            score = 0
            reasons = []
            
            r_subj = resource.subject.lower().strip()
            r_topic = resource.topic.lower().strip()
            r_type = resource.resource_type.lower().strip()
            r_diff = resource.difficulty.lower().strip()
            
            if r_subj in student_subjects:
                score += 20
                reasons.append("Matches your subject")
            if r_topic in student_topics:
                score += 30
                reasons.append("Matches your topic of interest")
                
            if r_topic in weak_topics:
                score += 40
                reasons.append("Addresses a topic you need practice on")
                if r_diff == "beginner" or student.current_knowledge_level == "beginner":
                    score += 15
                    reasons.append("Beginner friendly for weak topic")
            elif r_topic in strong_topics:
                if r_diff in ["intermediate", "advanced"]:
                    score += 20
                    reasons.append("Challenging material for mastered topic")
                    
            if r_type in student_pref_types:
                score += 10
                reasons.append("Matches preferred format")
                
            if student.target_level and student.target_level.lower() == r_diff:
                score += 10
                reasons.append(f"Matches target level ({r_diff})")
                    
            if score > 0:
                recommendations.append({
                    "resource": resource,
                    "match_score": score,
                    "reasons": ", ".join(reasons)
                })
                
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations

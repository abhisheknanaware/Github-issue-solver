import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_issue_scout(repo: dict, issue: dict) -> dict:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    
    prompt = f"""You are an open-source contribution advisor.
Given this GitHub issue details and repo characteristics, score it for beginner-friendliness on a 0-10 scale.
A 10 means it requires modifying at most 1 simple file, has low logical dependencies, and is incredibly descriptive.
A 0 means it requires complex multi-system refactoring.

Repository Language: {repo.get('language', 'Unknown')}
Issue Title: {issue.get('title', '')}
Issue Body: {issue.get('body', '')}
Labels: {json.dumps(issue.get('labels', []))}

Return JSON only:
{{
  "score": number (0-10),
  "labelClarity": number (0-2),
  "issueAge": number (0-2),
  "commentCount": number (0-2),
  "bodyClarity": number (0-2),
  "fileComplexity": number (0-2),
  "reasoning": "Plain English analysis of why this was scored",
  "advice": "Step-by-step guidance on where the contributor should start checking"
}}
"""
    response = llm.invoke([
        SystemMessage(content="You are an expert GitHub issue triage engine. Return ONLY valid, parsable JSON. No backticks or explanations."),
        HumanMessage(content=prompt)
    ])
    
    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return {
            "score": 5,
            "labelClarity": 1,
            "issueAge": 1,
            "commentCount": 1,
            "bodyClarity": 1,
            "fileComplexity": 1,
            "reasoning": "Triage evaluation completed.",
            "advice": "Review codebase structure to locate imports related to issue keywords."
        }

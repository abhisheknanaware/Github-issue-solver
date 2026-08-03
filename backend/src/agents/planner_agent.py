import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_planner(issue: dict, analysis: dict) -> list:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    
    prompt = f"""You are a software architect. Given this issue description and the code analysis, formulate a step-by-step implementation plan.
Each step must specify:
- The file to modify.
- The action (e.g., add import, edit logic, create handler).
- Description of exact logical steps to code.
- Estimated lines of code to write.

Issue Details:
Title: {issue.get('title')}
Body: {issue.get('body')}

Analysis Findings:
{json.dumps(analysis, indent=2)}

Return a JSON array only (no root key, just an array of objects):
[
  {{
    "stepNumber": 1,
    "filePath": "path/to/file.js",
    "action": "ACTION",
    "description": "Details of the change",
    "estimatedLines": 15
  }}
]
"""
    response = llm.invoke([
        SystemMessage(content="You are a system design planner. Return a JSON array only."),
        HumanMessage(content=prompt)
    ])

    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return [
            {
                "stepNumber": 1,
                "filePath": analysis.get("relevantFiles", ["index.js"])[0] if analysis else "index.js",
                "action": "modify",
                "description": "Examine code locations and edit to resolve description logs",
                "estimatedLines": 25
            }
        ]

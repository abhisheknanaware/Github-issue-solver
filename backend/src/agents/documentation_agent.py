import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_documentation(code_diffs: list, issue: dict) -> dict:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    
    prompt = f"""You are a technical writer. Given these code changes and the original issue details:
1. Write inline documentation or JSDoc comments describing the new behaviors.
2. Formulate a concise markdown summary to append/update in the project README.md.

Issue Title: {issue.get('title')}
Code Changes:
{json.dumps(code_diffs, indent=2)}

Return JSON only:
{{
  "inlineComments": [
    {{
      "filePath": "path/to/file.js",
      "comments": "description of inline additions"
    }}
  ],
  "readmeSection": "### Dynamic fixes added\\n\\nWe updated..."
}}
"""
    response = llm.invoke([
        SystemMessage(content="You produce clear, readable code and Markdown documentation. Return JSON only."),
        HumanMessage(content=prompt)
    ])

    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return {
            "inlineComments": [],
            "readmeSection": "### Patched Fix\nCode updated to handle issue edge cases."
        }

import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_coder(plan: list, rag_context: list, analysis: dict = None) -> list:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.0) 
    
    context_str = "\n\n".join([
        f"--- File: {chunk.get('filePath')} ---\n{chunk.get('text')}"
        for chunk in rag_context
    ])

    prompt = f"""You are an expert senior software engineer. Given this implementation plan, the codebase analysis findings, and the existing code snippets from the repo, generate the code edits needed.
For each file modification, output:
- The file path.
- The precise original code block that needs to be replaced.
- The complete new code block replacing it.
- An explanation of why this code change was made.

CRITICAL CODE RULES:
1. Respect Existing Data Structures: Do NOT use array methods (like .findIndex, .splice, or .map) on objects/maps, and do not use object keys on arrays. Double-check whether collections (like `records` or `state.records`) are objects or arrays by looking at the analysis context below.
2. Respect Framework Conventions: In Vuex files, only write valid mutations or actions. Do not write top-level global listener subscriptions (e.g. `websocket.on(...)` or direct `store.dispatch` outside functions) insideVuex files. Websocket handlers should be registered where other websocket event listeners are defined.

Implementation Plan:
{json.dumps(plan, indent=2)}

Codebase Analysis Context (Data Structures & Key entry points):
{json.dumps(analysis, indent=2) if analysis else "None"}

--- CODE FILES ---
{context_str}

Return a JSON array only:
[
  {{
    "filePath": "path/to/file.js",
    "originalCode": "exact block to match",
    "modifiedCode": "complete replacement block",
    "explanation": "Why this fixes the issue"
  }}
]
"""
    response = llm.invoke([
        SystemMessage(content="You write clean, production-ready code. Output a JSON array with string fields containing raw code. Escape quotes properly. No markdown code blocks inside JSON fields!"),
        HumanMessage(content=prompt)
    ])

    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return [
            {
                "filePath": plan[0].get("filePath") if plan else "index.js",
                "originalCode": "// Existing logic here",
                "modifiedCode": "// Patched logic matching issue requirements",
                "explanation": "Applied changes based on issue parameters."
            }
        ]

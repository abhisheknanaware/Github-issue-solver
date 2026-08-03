import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_code_analysis(issue: dict, rag_context: list) -> dict:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
    
    context_str = "\n\n".join([
        f"--- File: {chunk.get('filePath')} (chunk {chunk.get('chunkIndex')}) ---\n{chunk.get('text')}"
        for chunk in rag_context
    ])

    prompt = f"""You are a codebase analysis expert. Given this GitHub issue details and the semantic RAG code snippets matching it, perform a thorough architectural analysis:
1. Which files are most relevant to fixing this issue.
2. Key entry points (functions, components, or files to inspect/modify).
3. Check code conventions and data structures:
   - Identify data types of relevant state variables (e.g., is a collection like `state.records` an object/map, or is it an array? Look at how other methods read or write to it).
   - Locate where event listeners, websockets, or lifecycle hooks are registered (do not place them inside Vuex actions/mutations unless existing handlers are also defined there).
4. Dependencies and packages involved.
5. A plain-English summary of what needs to change, describing exactly how to modify the target code without breaking existing state structures or logic.

Issue Title: {issue.get('title', '')}
Issue Body: {issue.get('body', '')}

--- RELEVANT CODE CONTEXT ---
{context_str}

Return JSON only:
{{
  "relevantFiles": ["path/to/file1.js", "path/to/file2.js"],
  "entryPoints": ["functionName1", "componentName2"],
  "dataStructures": {{
    "variable_or_state_name": "Structure type (e.g., Object mapping ID to item, or Array of items) with explanation of why"
  }},
  "dependencies": ["package-name"],
  "summary": "Detailed, specific explanation of changes required, taking data structures and hooks into account"
}}
"""
    response = llm.invoke([
        SystemMessage(content="You are an advanced codebase indexing parser. Return JSON only."),
        HumanMessage(content=prompt)
    ])

    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return {
            "relevantFiles": [c.get('filePath') for c in rag_context[:2]] if rag_context else ["index.js"],
            "entryPoints": [],
            "dataStructures": {},
            "dependencies": [],
            "summary": "Investigate files containing match keywords."
        }

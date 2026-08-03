import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_test_generator(code_diffs: list, rag_context: list) -> list:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.1)

    diffs_str = json.dumps(code_diffs, indent=2)
    files_str = "\n".join([c.get('filePath') for c in rag_context]) if rag_context else ""

    prompt = f"""You are a test engineer. Given these code modifications, write comprehensive unit tests.
Use Jest for Javascript/TypeScript projects or Pytest for Python projects.
Cover: Happy path, edge cases, and unexpected errors.

Modified Changes:
{diffs_str}

Files present in context:
{files_str}

Return a JSON array only:
[
  {{
    "filePath": "tests/target.test.js",
    "content": "Full code content of the test file",
    "testFramework": "jest"
  }}
]
"""
    response = llm.invoke([
        SystemMessage(content="You generate highly reliable test suites. Output a JSON array with test script contents."),
        HumanMessage(content=prompt)
    ])

    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return [
            {
                "filePath": "test.js",
                "content": "// Unit test skeletons here",
                "testFramework": "jest"
            }
        ]

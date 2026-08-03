import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def run_pr_draft(state: dict) -> dict:
    llm = ChatOpenAI(model="gpt-4o", temperature=0.3)
    
    prompt = f"""You are an open-source contributor creating a Pull Request. Assemble details from previous stages to write:
1. A descriptive, short PR Title. It MUST follow Conventional Commits format, starting with a lowercase prefix followed by a colon (e.g. 'fix: preserve contact_inboxes on websocket contact.updated' or 'feat: add cloudflare worker support'). Do not capitalize the prefix (use 'fix:', not 'Fix:').
2. A comprehensive PR Body in professional markdown (Summary of changes, Motivation, How to verify).
3. A safe branch name suggestion (format: ai-agent/fix-{{issue_number}}-{{short_slug}}).

Issue details: {json.dumps(state['issue'])}
Code changes: {json.dumps(state['codeDiffs'])}
Tests generated: {json.dumps(state['tests'])}

Return JSON only:
{{
  "title": "PR Title",
  "body": "Markdown string containing description...",
  "labels": ["ai-approved", "enhancement"],
  "linkedIssue": "Fixes #{state['issue'].get('number', '')}",
  "branchName": "ai-agent/fix-issue-number-slug"
}}
"""
    response = llm.invoke([
        SystemMessage(content="You generate excellent PR descriptions. Return JSON only."),
        HumanMessage(content=prompt)
    ])

    try:
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception:
        return {
            "title": f"fix: resolve issue {state['issue'].get('title')}",
            "body": "This automated PR resolves open issues by introducing safety handlers.",
            "labels": ["ai-triage"],
            "linkedIssue": f"Fixes #{state['issue'].get('number')}",
            "branchName": f"ai-agent/fix-{state['issue'].get('number')}-patch"
        }

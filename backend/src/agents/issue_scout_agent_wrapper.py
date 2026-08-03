import sys
import json
import os

# Ensure python path incorporates current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from issue_scout_agent import run_issue_scout

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input payload passed."}))
        sys.exit(1)
        
    try:
        data = json.loads(sys.argv[1])
        repo = data.get("repo", {})
        issue = data.get("issue", {})
        
        result = run_issue_scout(repo, issue)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

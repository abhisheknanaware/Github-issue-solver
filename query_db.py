from pymongo import MongoClient
import os

mongo_uri = "mongodb+srv://root:7499631188@airbnbproject.nvhats3.mongodb.net/github-issue-agent?retryWrites=true&w=majority&appName=airbnbproject"
client = MongoClient(mongo_uri)
db = client["github-issue-agent"]

print("Collections:", db.list_collection_names())

# Get the latest PR Draft
drafts = list(db["prdrafts"].find().sort([("_id", -1)]).limit(1))
if drafts:
    draft = drafts[0]
    print("\n=== LATEST PR DRAFT ===")
    print("TITLE:", draft.get("title"))
    print("BRANCH:", draft.get("branchName"))
    print("PR URL:", draft.get("prUrl"))
    print("CODE DIFFS:")
    for diff in draft.get("codeDiffs", []):
        print(f"\n--- File: {diff.get('filePath')} ---")
        print(diff.get('modifiedCode'))
else:
    print("No drafts found.")

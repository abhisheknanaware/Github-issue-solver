import os
import sys
import dns.resolver
# Set custom DNS servers before connecting to MongoDB SRV
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']

from pymongo import MongoClient
from bson.objectid import ObjectId

mongo_uri = "mongodb+srv://root:7499631188@airbnbproject.nvhats3.mongodb.net/github-issue-agent?retryWrites=true&w=majority&appName=airbnbproject"

try:
    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    print("Connected to MongoDB:", db.name)
    
    # Get latest contribution
    contribution = db.contributions.find_one(sort=[("_id", -1)])
    if contribution:
        print("\n=== LATEST CONTRIBUTION ===")
        print("ID:", contribution["_id"])
        print("Status:", contribution["status"])
        print("Error:", contribution.get("error"))
        print("Stages:")
        for stage, data in contribution.get("stages", {}).items():
            print(f"- {stage}: status={data.get('status')}, hasOutput={data.get('output') is not None}, error={data.get('error')}")
            
        # Get PRDraft for this contribution
        draft = db.prdrafts.find_one({"contributionId": contribution["_id"]})
        print("\n=== PR DRAFT ===")
        if draft:
            print("ID:", draft["_id"])
            print("Title:", draft.get("title"))
            print("Branch:", draft.get("branchName"))
            print("Status:", draft.get("status"))
        else:
            print("No PRDraft found in db.prdrafts for contributionId:", contribution["_id"])
            
            # Let's see if there are any PRDrafts at all in the database
            draft_count = db.prdrafts.count_documents({})
            print(f"Total PRDrafts in collection: {draft_count}")
            if draft_count > 0:
                print("Latest PRDraft in collection:")
                latest_draft = db.prdrafts.find_one(sort=[("_id", -1)])
                print("  ID:", latest_draft["_id"])
                print("  ContributionId:", latest_draft.get("contributionId"))
                print("  Title:", latest_draft.get("title"))
                print("  Branch:", latest_draft.get("branchName"))
    else:
        print("No contributions found.")
except Exception as e:
    print("Error:", e)

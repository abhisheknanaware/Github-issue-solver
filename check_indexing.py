import os
import sys
import dns.resolver
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']

from pymongo import MongoClient
from bson.objectid import ObjectId

mongo_uri = "mongodb+srv://root:7499631188@airbnbproject.nvhats3.mongodb.net/github-issue-agent?retryWrites=true&w=majority&appName=airbnbproject"

try:
    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    print("Connected to MongoDB:", db.name)
    
    repos = list(db.repositories.find())
    print(f"Found {len(repos)} repositories in database:")
    for repo in repos:
        print(f"\n- Full Name: {repo.get('fullName')}")
        print(f"  ID: {repo.get('_id')}")
        print(f"  isIndexed: {repo.get('isIndexed')}")
        print(f"  starred/forks: stars={repo.get('stars')}, forks={repo.get('forks')}")
        print(f"  files count in db: {len(repo.get('files', []))}")
        print(f"  indexedAt: {repo.get('indexedAt')}")
except Exception as e:
    print("Error:", e)

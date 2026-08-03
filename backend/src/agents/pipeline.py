import sys
import os
import json
import traceback
from typing import TypedDict, List, Dict, Any, Optional

# Ensure python path incorporates current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

# Import agent modules
from issue_scout_agent import run_issue_scout
from codebase_analyzer_agent import run_code_analysis
from planner_agent import run_planner
from coder_agent import run_coder
from test_generator_agent import run_test_generator
from documentation_agent import run_documentation
from pr_draft_agent import run_pr_draft

# Define State Structure
class PipelineState(TypedDict):
    repo: Dict[str, Any]
    issue: Dict[str, Any]
    ragContext: List[Dict[str, Any]]
    analysis: Optional[Dict[str, Any]]
    plan: Optional[List[Dict[str, Any]]]
    codeDiffs: Optional[List[Dict[str, Any]]]
    tests: Optional[List[Dict[str, Any]]]
    docs: Optional[Dict[str, Any]]
    prDraft: Optional[Dict[str, Any]]
    currentStage: str
    error: Optional[str]

def emit_stage_update(stage_name: str, status: str, output: Any = None, error: str = None):
    payload = {
        "stage": stage_name,
        "status": status,
        "output": output,
        "error": error
    }
    print(json.dumps(payload), flush=True)

# ────────────────────────────────────────────────────────
# LANGGRAPH WRAPPERS (NODES)
# ────────────────────────────────────────────────────────
def issue_scout_node(state: PipelineState) -> PipelineState:
    emit_stage_update("issueScout", "running")
    try:
        res = run_issue_scout(state["repo"], state["issue"])
        emit_stage_update("issueScout", "completed", res)
        state["issue"]["readinessScore"] = res.get("score", 5)
        return {**state, "currentStage": "codeAnalysis"}
    except Exception as e:
        emit_stage_update("issueScout", "failed", error=str(e))
        raise e

def code_analysis_node(state: PipelineState) -> PipelineState:
    emit_stage_update("codeAnalysis", "running")
    try:
        res = run_code_analysis(state["issue"], state["ragContext"])
        emit_stage_update("codeAnalysis", "completed", res)
        return {**state, "analysis": res, "currentStage": "planner"}
    except Exception as e:
        emit_stage_update("codeAnalysis", "failed", error=str(e))
        raise e

def planner_node(state: PipelineState) -> PipelineState:
    emit_stage_update("planner", "running")
    try:
        res = run_planner(state["issue"], state["analysis"])
        emit_stage_update("planner", "completed", res)
        return {**state, "plan": res, "currentStage": "coder"}
    except Exception as e:
        emit_stage_update("planner", "failed", error=str(e))
        raise e

def coder_node(state: PipelineState) -> PipelineState:
    emit_stage_update("coder", "running")
    try:
        res = run_coder(state["plan"], state["ragContext"], state["analysis"])
        emit_stage_update("coder", "completed", res)
        return {**state, "codeDiffs": res, "currentStage": "testGenerator"}
    except Exception as e:
        emit_stage_update("coder", "failed", error=str(e))
        raise e

def test_generator_node(state: PipelineState) -> PipelineState:
    emit_stage_update("testGenerator", "running")
    try:
        res = run_test_generator(state["codeDiffs"], state["ragContext"])
        emit_stage_update("testGenerator", "completed", res)
        return {**state, "tests": res, "currentStage": "documentation"}
    except Exception as e:
        emit_stage_update("testGenerator", "failed", error=str(e))
        raise e

def documentation_node(state: PipelineState) -> PipelineState:
    emit_stage_update("documentation", "running")
    try:
        res = run_documentation(state["codeDiffs"], state["issue"])
        emit_stage_update("documentation", "completed", res)
        return {**state, "docs": res, "currentStage": "prDraft"}
    except Exception as e:
        emit_stage_update("documentation", "failed", error=str(e))
        raise e

def pr_draft_node(state: PipelineState) -> PipelineState:
    emit_stage_update("prDraft", "running")
    try:
        res = run_pr_draft(state)
        emit_stage_update("prDraft", "completed", res)
        return {**state, "prDraft": res, "currentStage": "completed"}
    except Exception as e:
        emit_stage_update("prDraft", "failed", error=str(e))
        raise e

# ────────────────────────────────────────────────────────
# WIRE THE STATEGRAPH
# ────────────────────────────────────────────────────────
builder = StateGraph(PipelineState)

# Add Node Blocks
builder.add_node("issueScout", issue_scout_node)
builder.add_node("codeAnalysis", code_analysis_node)
builder.add_node("planner", planner_node)
builder.add_node("coder", coder_node)
builder.add_node("testGenerator", test_generator_node)
builder.add_node("documentation", documentation_node)
builder.add_node("prDraft", pr_draft_node)

# Set execution boundaries
builder.set_entry_point("issueScout")
builder.add_edge("issueScout", "codeAnalysis")
builder.add_edge("codeAnalysis", "planner")
builder.add_edge("planner", "coder")
builder.add_edge("coder", "testGenerator")
builder.add_edge("testGenerator", "documentation")
builder.add_edge("documentation", "prDraft")
builder.add_edge("prDraft", END)

graph = builder.compile()

# ────────────────────────────────────────────────────────
# MAIN EXECUTOR ENTRY POINT
# ────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No JSON payload parameter passed in argv."}), file=sys.stderr)
        sys.exit(1)

    try:
        raw_input = json.loads(sys.argv[1])
        initial_state = {
            "repo": raw_input.get("repo", {}),
            "issue": raw_input.get("issue", {}),
            "ragContext": raw_input.get("ragContext", []),
            "analysis": None,
            "plan": None,
            "codeDiffs": None,
            "tests": None,
            "docs": None,
            "prDraft": None,
            "currentStage": "issueScout",
            "error": None
        }

        # Run compilation
        final_state = graph.invoke(initial_state)
        emit_stage_update("pipeline", "completed", output={"final_state": final_state})

    except Exception as err:
        tb = traceback.format_exc()
        print(json.dumps({"error": str(err), "stack": tb}), file=sys.stderr)
        sys.exit(1)

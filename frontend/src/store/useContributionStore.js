import { create } from 'zustand';
import api from '../api/axios.js';

const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.VITE_BACKEND_URL 
    ? `${import.meta.env.VITE_BACKEND_URL}/api` 
    : 'http://localhost:3000/api');

export const useContributionStore = create((set, get) => ({
  contributions: [],
  recentContributions: [],
  currentContribution: null,
  currentDraft: null,
  pipelineStages: {
    issueScout: { status: 'pending', output: null, error: null },
    codeAnalysis: { status: 'pending', output: null, error: null },
    planner: { status: 'pending', output: null, error: null },
    coder: { status: 'pending', output: null, error: null },
    testGenerator: { status: 'pending', output: null, error: null },
    documentation: { status: 'pending', output: null, error: null },
    prDraft: { status: 'pending', output: null, error: null },
  },
  isLoading: false,
  error: null,

  fetchRecentContributions: async () => {
    try {
      const res = await api.get('/agent/recent');
      set({ recentContributions: res.data.data || [] });
    } catch (err) {
      // fail silently — timeline just stays empty
    }
  },

  startContribution: async (repoId, issueId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/agent/start', { repoId, issueId });
      set({ isLoading: false });
      return res.data.data.contributionId;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to start AI solver pipeline' });
      throw err;
    }
  },

  fetchContribution: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/agent/contribution/${id}`);
      const { contribution, draft } = res.data.data;
      
      // Sync pipelineStages with DB loaded values
      set({
        currentContribution: contribution,
        currentDraft: draft,
        pipelineStages: {
          issueScout: contribution.stages.issueScout || { status: 'pending' },
          codeAnalysis: contribution.stages.codeAnalysis || { status: 'pending' },
          planner: contribution.stages.planner || { status: 'pending' },
          coder: contribution.stages.coder || { status: 'pending' },
          testGenerator: contribution.stages.testGenerator || { status: 'pending' },
          documentation: contribution.stages.documentation || { status: 'pending' },
          prDraft: contribution.stages.prDraft || { status: 'pending' },
        },
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to load contribution' });
    }
  },

  streamContribution: (contributionId, onStageComplete) => {
    // Clean up existing state
    set({
      pipelineStages: {
        issueScout: { status: 'pending', output: null, error: null },
        codeAnalysis: { status: 'pending', output: null, error: null },
        planner: { status: 'pending', output: null, error: null },
        coder: { status: 'pending', output: null, error: null },
        testGenerator: { status: 'pending', output: null, error: null },
        documentation: { status: 'pending', output: null, error: null },
        prDraft: { status: 'pending', output: null, error: null },
      },
    });

    const sseUrl = `${API_URL}/agent/stream/${contributionId}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle sync event (fetches existing state if user refreshes page)
        if (data.event === 'sync') {
          set({
            pipelineStages: {
              issueScout: data.stages.issueScout || { status: 'pending' },
              codeAnalysis: data.stages.codeAnalysis || { status: 'pending' },
              planner: data.stages.planner || { status: 'pending' },
              coder: data.stages.coder || { status: 'pending' },
              testGenerator: data.stages.testGenerator || { status: 'pending' },
              documentation: data.stages.documentation || { status: 'pending' },
              prDraft: data.stages.prDraft || { status: 'pending' },
            },
          });
          return;
        }

        const { stage, status, output, error } = data;
        
        if (stage) {
          set((state) => {
            const updatedStages = {
              ...state.pipelineStages,
              [stage]: { status, output, error },
            };
            return { pipelineStages: updatedStages };
          });

          if (status === 'completed' && onStageComplete) {
            onStageComplete(stage, output);
          }
        }

        // Close connection if pipeline terminates
        if (status === 'failed' || (stage === 'prDraft' && status === 'completed')) {
          eventSource.close();
        }

      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Connection Error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  },
}));

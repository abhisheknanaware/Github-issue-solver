import { create } from 'zustand';
import api from '../api/axios.js';

export const useRepoStore = create((set, get) => ({
  repos: [],
  githubRepos: [],
  currentRepo: null,
  issues: [],
  fileTree: [],
  isLoading: false,
  error: null,

  fetchRepos: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/github/repos/connected');
      set({ repos: res.data.repositories || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch connected repositories' });
    }
  },

  fetchGithubRepos: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/github/repos');
      set({ githubRepos: res.data.data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch GitHub repositories' });
    }
  },

  connectRepo: async (owner, repo) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/github/repos/connect', { owner, repo });
      const newRepo = res.data.data;
      set((state) => ({
        repos: [newRepo, ...state.repos.filter((r) => r._id !== newRepo._id)],
        currentRepo: newRepo,
        isLoading: false,
      }));
      return newRepo;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to connect repository' });
      throw err;
    }
  },

  fetchRepoData: async (repoId) => {
    set({ isLoading: true, error: null, currentRepo: null, issues: [], fileTree: [] });
    try {
      const [repoRes, issuesRes, treeRes] = await Promise.all([
        api.get(`/github/repos/connected/${repoId}`),
        api.get(`/github/repos/${repoId}/issues`),
        api.get(`/github/repos/${repoId}/tree`),
      ]);
      set({
        currentRepo: repoRes.data.repository,
        issues: issuesRes.data.data || [],
        fileTree: treeRes.data.data || [],
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to fetch repository data',
      });
    }
  },
}));

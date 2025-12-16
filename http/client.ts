import axios from 'axios';

// Create an isolated axios instance for this copy of local-dev-lib.
// This prevents issues when multiple copies are loaded and share the global
// axios, where each copy would register interceptors on the shared instance
// causing errors to be wrapped multiple times.
export const httpClient = axios.create();

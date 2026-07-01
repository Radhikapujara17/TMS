# Plan Review: Task Manager App (MERN + Socket.IO)

* **Document Reviewed:** [technical-plan-tms.md](file:///C:/Users/LENOVO/Projects/Personal%20Projects/TMS/plans/technical-plan-tms.md)
* **Overall Rating:** **9/10 (Excellent)**
* **Review Date:** July 1, 2026

---

## Overview

The plan outlines a pragmatic, well-structured 60-minute technical exercise for a full-stack MERN application with a real-time event layer powered by Socket.IO. The choice of architecture is clean, and the timing budgets are realistic for a mid-to-senior engineering interview. 

Below is a detailed critique of the plan, including minor technical bugs in the documentation code snippets, improvements, and suggested topics to probe during interviews.

---

## 1. Identified Code Snippet Bugs & Discrepancies

While the implementation in the codebase is mostly correct, the code blocks in the plan document have a few bugs that might cause issues if a candidate follows them exactly:

### A. Typo in Stats Aggregation (Phase 3)
In the `topTag` aggregation pipeline in the plan:
```javascript
const topTag = await Task.aggregate([
  { $unwind: '$tags' },
  { $group: { _id: '$tag', count: { $sum: 1 } } }, // <-- Bug here
  { $sort: { count: -1 } },
  { $limit: 1 }
]);
```
* **Issue:** After unwinding `'$tags'`, the field is still named `tags` (as a string, rather than an array). Grouping by `'$tag'` (singular) will resolve to `null`, meaning all tags will be grouped together instead of counted individually.
* **Correction:** Change the grouping target to `'$tags'`:
  ```javascript
  { $group: { _id: '$tags', count: { $sum: 1 } } }
  ```
  *(Note: This is correctly implemented in [stats.js](file:///C:/Users/LENOVO/Projects/Personal%20Projects/TMS/server/routes/stats.js#L14), but should be corrected in the plan.)*

### B. Mongoose Schema ReferenceError for `ObjectId` (Phase 2)
In the plan:
```javascript
taskId: { type: ObjectId, ref: 'Task', required: true }
```
* **Issue:** Unless `ObjectId` is explicitly destructured from the `mongoose` package (e.g., `const { ObjectId } = require('mongoose').Types`), this will throw a `ReferenceError` at runtime.
* **Correction:** Use the full mongoose path:
  ```javascript
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true }
  ```
  *(Note: The codebase correctly uses `Types.ObjectId` destructured from mongoose in [Activity.js](file:///C:/Users/LENOVO/Projects/Personal%20Projects/TMS/server/models/Activity.js#L4).)*

### C. Aggressive Socket Listener Cleanup (Phase 4)
In the React frontend cleanup hook:
```javascript
return () => socket.off(); // cleanup
```
* **Issue:** Calling `.off()` without parameters removes **all** event listeners on the socket client instance. Because the socket connection is imported as a singleton from `socket.js`, if another component in the app registered listener callbacks, they would be wiped out.
* **Correction:** Unsubscribe only from the specific listeners registered by this component:
  ```javascript
  return () => {
    socket.off('taskCreated');
    socket.off('taskUpdated');
    socket.off('activityCreated');
  };
  ```

---

## 2. Key Areas for Improvement & Enhancements

Adding these points to the plan will make the reference implementation more robust:

### A. Root-Level Dev Script (Monorepo Orchestration)
To run both backend and frontend concurrently, instead of asking candidates to open two terminal windows and run manually, recommend setting up a root-level `package.json` using `concurrently`:
```json
{
  "name": "tms-monorepo",
  "scripts": {
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### B. Error Handling & Validation
* The snippets assume happy-path execution. In real systems (and for senior candidates), we expect error handling:
  * Backend: Try/catch blocks with proper status codes (e.g., returning 400 for Mongoose validation errors).
  * Frontend: Basic visual state handling for fetch/socket failures or loading indicators.
* Adding a small checklist item about handling database connection failures or input validation adds depth.

### C. Vite Config Proxy Structure
In Vite configuration files, `server` must be wrapped inside `defineConfig`:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true }
    }
  }
});
```

---

## 3. Recommended Interview Probing Questions

Add these to the **"Key Decision Points"** section of the plan to test senior candidates:

1. **"What happens if the Socket connection drops and reconnects?"**
   * *Answer:* The client might miss server events that occurred during the downtime. A robust frontend should re-fetch database state on connection recovery (e.g., listening to Socket.IO's `connect` event).
2. **"How would you scale Socket.IO across multiple server instances?"**
   * *Answer:* Since Socket.IO keeps state in memory, you need a Redis Adapter to sync events across nodes and configure sticky sessions at the load balancer level.
3. **"What are the implications of CORS settings `origin: '*'`?"**
   * *Answer:* Useful for local development, but in production it opens security vulnerabilities. It should be locked down to verified client origins.
4. **"How should we handle soft-deletes of tasks when activity logs reference them?"**
   * *Answer:* If a task is deleted but activity logs remain, `.populate('taskId', 'title')` returns `null` or errors. We should handle this gracefully on the UI or use soft-deletes (`isDeleted: true`).

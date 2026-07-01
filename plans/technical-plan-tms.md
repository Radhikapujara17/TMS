## Technical Plan: Task Manager App (MERN + Socket.IO)

### Overview of the Architecture

The system has three layers: a React frontend, a Node/Express backend, and MongoDB for persistence. Socket.IO sits as a real-time layer between the backend and all connected clients. The backend emits events after every write operation, and the frontend listens and updates state directly — no polling needed.

---

### Phase 1 — Project Scaffold (5 min)

Create a monorepo with two folders:

```
/task-manager
  /client   → React app (Vite)
  /server   → Node.js + Express
```

**Server init:**
```bash
mkdir server && cd server
npm init -y
npm install express mongoose socket.io cors dotenv
```

**Client init:**
```bash
npm create vite@latest client -- --template react
cd client && npm install socket.io-client
```

Keep a `.env` in `/server` with:
```
MONGO_URI=mongodb://localhost:27017/taskmanager
PORT=5000
```

---

### Phase 2 — Database Design (5 min)

Two Mongoose models. Keep them lean.

**Task model** (`/server/models/Task.js`):
```js
{
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  tags:        [String],
  createdAt:   { type: Date, default: Date.now }
}
```

**Activity model** (`/server/models/Activity.js`):
```js
{
  taskId:    { type: ObjectId, ref: 'Task', required: true },
  action:    { type: String, enum: ['task_created', 'status_changed'], required: true },
  meta:      { type: Object },   // e.g. { from: 'todo', to: 'in-progress' }
  timestamp: { type: Date, default: Date.now }
}
```

---

### Phase 3 — Backend (20 min)

**`server/index.js` — Entry point:**

Wire Express, HTTP server, Socket.IO, and Mongoose together. Attach the Socket.IO instance to `app.locals` so routes can access it without circular imports.

```js
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.locals.io = io;   // make io available in route handlers

mongoose.connect(process.env.MONGO_URI);
app.use(cors());
app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoute);

httpServer.listen(5000);
```

**`server/routes/tasks.js` — Four endpoints:**

`GET /api/tasks` — Return all tasks, sorted by `createdAt` descending.

`POST /api/tasks` — Create task, create activity, emit two Socket.IO events:
```js
const task = await Task.create(req.body);
const activity = await Activity.create({ taskId: task._id, action: 'task_created' });
req.app.locals.io.emit('taskCreated', task);
req.app.locals.io.emit('activityCreated', activity);
res.json(task);
```

`PATCH /api/tasks/:id/status` — Update status only, create activity with `meta: { from, to }`, emit `taskUpdated` and `activityCreated`.

`GET /api/tasks/:id/activities` — Return activities for a task (optional, nice to have).

**`server/routes/stats.js` — Stats endpoint:**

`GET /api/stats` — Aggregate in one async block:
```js
const total = await Task.countDocuments();
const byStatus = await Task.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);
const topTag = await Task.aggregate([
  { $unwind: '$tags' },
  { $group: { _id: '$tag', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 1 }
]);
res.json({ total, byStatus, mostCommonTag: topTag[0]?._id ?? null });
```

**Activity endpoint** (`GET /api/activities`): Return latest 20 activities, populated with task title for display convenience.

---

### Phase 4 — Frontend (20 min)

Keep it as a **single `App.jsx`** with a few child components. No routing needed.

**Socket.IO setup — `src/socket.js`:**
```js
import { io } from 'socket.io-client';
export const socket = io('http://localhost:5000');
```

**`App.jsx` structure:**

```
App
 ├── CreateTaskForm     (controlled inputs + POST)
 ├── TaskList           (list of TaskCard)
 │    └── TaskCard      (title, description, tags, status dropdown)
 └── ActivityFeed       (latest 10 activities)
```

**State management in `App.jsx`:**

```js
const [tasks, setTasks] = useState([]);
const [activities, setActivities] = useState([]);

// Initial fetch on mount
useEffect(() => {
  fetch('/api/tasks').then(r => r.json()).then(setTasks);
  fetch('/api/activities').then(r => r.json()).then(setActivities);
}, []);

// Socket listeners
useEffect(() => {
  socket.on('taskCreated', task => setTasks(prev => [task, ...prev]));
  socket.on('taskUpdated', updated =>
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t))
  );
  socket.on('activityCreated', a => setActivities(prev => [a, ...prev].slice(0, 20)));
  return () => socket.off(); // cleanup
}, []);
```

**CreateTaskForm** — Controlled form with fields for title, description, status (select), and tags (comma-separated input that splits on submit). Calls `POST /api/tasks`.

**TaskCard** — Renders task details. Has a `<select>` for status that calls `PATCH /api/tasks/:id/status` on change.

**ActivityFeed** — Maps over activities array and renders `action + timestamp`. Use `new Date(a.timestamp).toLocaleTimeString()` for a clean display.

---

### Phase 5 — Wiring & Testing (10 min)

Run both servers concurrently. In `/client/vite.config.js`, add a proxy so frontend API calls don't need full URLs:

```js
server: {
  proxy: {
    '/api': 'http://localhost:5000',
    '/socket.io': { target: 'http://localhost:5000', ws: true }
  }
}
```

**Quick manual test checklist:**
- Open two browser tabs on `localhost:5173`
- Create a task in tab 1 → confirm it appears in tab 2 without refresh
- Change status in tab 2 → confirm tab 1 updates
- Check activity feed updates in both tabs
- Hit `GET /api/stats` directly in the browser — confirm the JSON response

---

### File Structure Summary

```
/server
  index.js
  /models
    Task.js
    Activity.js
  /routes
    tasks.js
    stats.js
    activities.js

/client/src
  App.jsx
  socket.js
  /components
    CreateTaskForm.jsx
    TaskList.jsx
    TaskCard.jsx
    ActivityFeed.jsx
```

---

### Time Budget

| Phase | Time |
|---|---|
| Scaffold + env | 5 min |
| Mongoose models | 5 min |
| Backend routes + Socket.IO | 20 min |
| React UI + socket listeners | 20 min |
| Proxy config + end-to-end test | 10 min |
| **Total** | **60 min** |

---

### Key Decision Points to Discuss with Candidates

These are areas where experienced developers would make intentional choices — good to probe during review:

**Why attach `io` to `app.locals`?** Avoids circular imports between `index.js` and route files. Alternatives include a dedicated `socket.js` module that exports the io instance.

**Why two separate Socket.IO events instead of one?** `taskCreated` vs `activityCreated` lets the frontend update the task list and the activity feed independently without coupling them.

**Why `PATCH /tasks/:id/status` instead of `PUT /tasks/:id`?** Follows REST partial-update semantics and makes intent clear — the endpoint's sole job is to change status, which also makes it easier to validate and log.

**Activity `meta` field as a plain Object?** Flexible but untyped. A stricter approach would use discriminated sub-schemas per action type. Tradeoff is flexibility vs. schema safety.

**Why `socket.off()` in the useEffect cleanup?** Prevents duplicate event listeners if the component re-mounts, which would cause duplicate state updates.

This plan gives you a solid reference implementation to walk candidates through after the test.
import { useEffect, useState } from "react";

const API = "http://localhost:5000/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light-theme"
  );

  // Apply the theme class to <body> and remember it
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Load tasks once when the page opens
  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => setError("Could not reach the server. Is Flask running?"));
  }, []);

  // Send a request and return the parsed JSON, or throw with the API's message
  async function request(url, options) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function addTask(e) {
    e.preventDefault();
    if (!text.trim()) return setError("Type a task first.");
    try {
      const task = await request(API, {
        method: "POST",
        body: JSON.stringify({ title: text }),
      });
      setTasks([...tasks, task]);
      setText("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await request(`${API}/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    try {
      await request(`${API}/${id}`, { method: "DELETE" });
      setTasks(tasks.filter((t) => t.id !== id));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app">
      <header className="top">
        <h1>My To-Do List</h1>
        <button
          className="theme-btn"
          onClick={() =>
            setTheme(theme === "light-theme" ? "dark-theme" : "light-theme")
          }
        >
          {theme === "light-theme" ? "Dark mode" : "Light mode"}
        </button>
      </header>

      <form className="add" onSubmit={addTask}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="list">
        {tasks.map((task) => (
          <li key={task.id}>
            <span
              className={task.completed ? "title done" : "title"}
              onClick={() => toggleTask(task)}
            >
              {task.title}
            </span>
            <button className="del" onClick={() => deleteTask(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && <p className="empty">No tasks yet. Add one above.</p>}
    </main>
  );
}

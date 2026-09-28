from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

app = Flask(__name__)
CORS(app)  # allow the React dev server (different port) to call this API

# In-memory storage (resets when the server restarts)
tasks = []
next_id = 1


def find_task(task_id):
    return next((t for t in tasks if t["id"] == task_id), None)


@app.get("/tasks")
def get_tasks():
    return jsonify(tasks), 200


@app.post("/tasks")
def add_task():
    global next_id
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get("title"), str) or not data["title"].strip():
        return jsonify({"error": "A non-empty 'title' is required."}), 400

    task = {"id": next_id, "title": data["title"].strip(), "completed": False}
    next_id += 1
    tasks.append(task)
    return jsonify(task), 201


@app.put("/tasks/<int:task_id>")
def update_task(task_id):
    task = find_task(task_id)
    if task is None:
        return jsonify({"error": f"Task {task_id} not found."}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    if "completed" in data:
        if not isinstance(data["completed"], bool):
            return jsonify({"error": "'completed' must be true or false."}), 400
        task["completed"] = data["completed"]

    if "title" in data:
        if not isinstance(data["title"], str) or not data["title"].strip():
            return jsonify({"error": "'title' must be a non-empty string."}), 400
        task["title"] = data["title"].strip()

    return jsonify(task), 200


@app.delete("/tasks/<int:task_id>")
def delete_task(task_id):
    task = find_task(task_id)
    if task is None:
        return jsonify({"error": f"Task {task_id} not found."}), 404
    tasks.remove(task)
    return jsonify({"message": "Task deleted."}), 200


# ---- Error handlers: always return JSON ----
@app.errorhandler(HTTPException)
def handle_http_error(e):
    return jsonify({"error": e.description}), e.code


@app.errorhandler(Exception)
def handle_server_error(e):
    return jsonify({"error": "Internal server error."}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)

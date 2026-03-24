# 📊 ATM Task Performance Analytics System

This document outlines the architecture, algorithms, and technical design of the Performance Analytics module, currently visualized on the `/dashboard/performance` Admin Dashboard.

## 🧠 The ATM Score Algorithm
The **Academic Task Metric (ATM) Score** is the core smart-evaluation algorithm that objectively assesses an operative's (student's) performance. Instead of solely relying on academic grades, this system evaluates students on a holistic 100-point scale based on **Quality, Timeliness, and Drive**.

### 1. Task Quality (Weight: 60%)
Evaluates the sheer academic performance derived from graded missions.
* **Formula:** `(Total Marks Obtained / Total Max Marks) * 60`
* **Logic:** Calculates the cumulative percentage of all graded tasks and scales it to a maximum of 60 points. Un-graded tasks or tasks without `max_marks` are excluded from the denominator to avoid penalizing students for pending faculty reviews.

### 2. Timeliness & Reliability (Weight: 20%)
Evaluates the operative's time-management and adherence to strict deadlines.
* **Formula:** `(On-Time Submissions / Total Graded or Submitted Tasks) * 20`
* **Logic:** Calculates the ratio of tasks submitted *before* the designated deadline (`is_late == False`). If a student consistently submits work late, they lose massive points in this category, regardless of academic quality.

### 3. Completion Drive (Weight: 20%)
Evaluates the operative's sheer accountability and willingness to tackle assigned missions.
* **Formula:** `(Total Submitted Tasks / Total Assigned Tasks That Are Due) * 20`
* **Logic:** Measures the ratio of tasks a student has actually submitted versus tasks they simply ignored (resulting in overdue/missing status). Future tasks whose deadlines have not yet passed are excluded from the total assigned count to prevent penalizing active timelines.

---

## 📡 Backend Architecture (`backend/routers/analytics.py`)

The analytics engine operates on two primary FastApi endpoints:

### `GET /analytics/performance/stats`
Calculates high-level institutional Key Performance Indicators (KPIs) for the top dashboard cards.
* **Response Values:**
  * `average_score`: The global mean ATM Score across all active students.
  * `total_evaluated`: The total number of students who have completed at least one task.
  * `pass_rate`: The percentage of students maintaining an ATM Score above the minimum operational threshold (e.g., > 50 points).

### `GET /analytics/performance/students`
The core computational engine. Iterates through the `users` table, filters for `role = student`, and performs complex joins with `tasks` and `task_submissions` to execute the ATM Algorithm per student.
* **Response Values:** A deeply aggregated JSON array of all students, containing their computed ATM Score, Grade percentage, and exact task completion rates. The array is pre-sorted on the backend in descending order by `atm_score` to instantly populate leaderboards.

---

## 💻 Frontend Visualization (`frontend/src/pages/AdminPerformance.js`)

The React frontend fetches data from the backend analytics engine to render real-time, responsive data visualizations.

### Key Components:
1. **KPI Glass Cards:** Static metric visualizations rendering global statistics (`/stats` endpoint).
2. **Grade Distribution Chart:** Built utilizing `recharts`. The frontend maps the array from `/students` into discrete performance buckets (e.g., 90-100%, 80-89%, <60%) and renders a beautiful Bar Chart showing institutional bell curves.
3. **Top Performers Ledger:** Dynamically maps through the highest-ranking students returned by the `/students` endpoint, appending unique UI badges (Gold/Silver/Bronze) based on their array index.

## 🔒 Future Considerations & Extensibility
If the institutional requirements evolve, the ATM Algorithm can easily be refactored to include:
* **Peer Evaluation Scores:** By pulling data from the `contribution_logs` table for Group Projects.
* **Milestone Adherence:** By checking the `academic_planner` and `todos` table for self-managed objective completion tracking.

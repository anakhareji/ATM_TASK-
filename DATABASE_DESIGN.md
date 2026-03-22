# Database Design Documentation

This document provides a detailed overview of the database tables, attributes, fields, and constraints for the Academic Task Management (ATM) System.

---

## Table 1: Users
**Description:** Stores user details, including login credentials, roles (Admin, Faculty, Student), and academic associations.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for each user. |
| 2 | name | VARCHAR(100) | NOT NULL | Full name of the user. |
| 3 | email | VARCHAR(100) | UNIQUE, NOT NULL | Email address used for login. |
| 4 | password | VARCHAR(255) | NOT NULL | Hashed password for security. |
| 5 | role | VARCHAR(20) | NOT NULL | User role: admin, faculty, student, etc. |
| 6 | status | VARCHAR(20) | DEFAULT 'active' | Current account status (active, inactive). |
| 7 | avatar | TEXT | NULL | URL or path to user's profile image. |
| 8 | department_id | INTEGER | FOREIGN KEY | ID of the department the user belongs to. |
| 9 | program_id | INTEGER | FOREIGN KEY | ID of the academic program. |
| 10 | course_id | INTEGER | FOREIGN KEY | ID of the course. |
| 11 | batch | VARCHAR(20) | NULL | Graduation batch (e.g., 2024-2027). |
| 12 | created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp when the user was created. |
| 13 | updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of last update. |

---

## Table 2: Projects
**Description:** Stores information about academic projects created by faculty or admins.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique project identifier. |
| 2 | title | VARCHAR(150) | NOT NULL | Title of the academic project. |
| 3 | description | VARCHAR(500) | NULL | Detailed project description. |
| 4 | department_id | INTEGER | FOREIGN KEY | Department associated with the project. |
| 5 | course_id | INTEGER | FOREIGN KEY | Course associated with the project. |
| 6 | lead_faculty_id| INTEGER | FOREIGN KEY | Faculty member leading the project. |
| 7 | start_date | DATE | NULL | Official project start date. |
| 8 | end_date | DATE | NULL | Official project end date. |
| 9 | status | VARCHAR(20) | NULL | Status: active, completed, archived. |
| 10 | visibility | VARCHAR(50) | NULL | Visibility level (public, private). |
| 11 | created_by | INTEGER | FOREIGN KEY | User who created the project. |

---

## Table 3: Tasks
**Description:** Individual tasks or assignments within a project assigned to students or groups.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique task identifier. |
| 2 | title | VARCHAR(200) | NOT NULL | Name of the task. |
| 3 | description | VARCHAR(500) | NULL | Task requirements and instructions. |
| 4 | priority | VARCHAR(20) | NULL | Priority level (low, medium, high). |
| 5 | deadline | DATETIME | NOT NULL | Submission deadline. |
| 6 | max_marks | INTEGER | NULL | Maximum points for the task. |
| 7 | project_id | INTEGER | FOREIGN KEY, NOT NULL | Project this task belongs to. |
| 8 | faculty_id | INTEGER | FOREIGN KEY, NOT NULL | Faculty who assigned the task. |
| 9 | student_id | INTEGER | FOREIGN KEY | Specific student assigned (if individual). |
| 10 | group_id | INTEGER | FOREIGN KEY | Specific group assigned (if group task). |
| 11 | status | VARCHAR(30) | NULL | Task status (pending, submitted, graded). |
| 12 | created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date task was created. |

---

## Table 4: Task Submissions
**Description:** Records of student submissions for assigned tasks.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique submission identifier. |
| 2 | task_id | INTEGER | FOREIGN KEY, NOT NULL | The task being submitted. |
| 3 | student_id | INTEGER | FOREIGN KEY, NOT NULL | Student who made the submission. |
| 4 | submission_text| VARCHAR(1000)| NULL | Text-based content of the submission. |
| 5 | file_url | VARCHAR(500) | NULL | Link to uploaded submission file. |
| 6 | submitted_at | DATETIME | NULL | Timestamp of submission. |
| 7 | status | VARCHAR(30) | NULL | Status (submitted, late, reviewed). |
| 8 | marks_obtained | INTEGER | NULL | Marks awarded by the faculty. |
| 9 | feedback | TEXT | NULL | Comments or feedback from faculty. |

---

## Table 5: Student Performance
**Description:** Aggregated performance data and grades for students across projects.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique record identifier. |
| 2 | student_id | INTEGER | FOREIGN KEY, NOT NULL | Student being evaluated. |
| 3 | project_id | INTEGER | FOREIGN KEY, NOT NULL | Project context for evaluation. |
| 4 | faculty_id | INTEGER | FOREIGN KEY, NOT NULL | Faculty providing the evaluation. |
| 5 | final_score | FLOAT | NULL | Final calculated score. |
| 6 | grade | VARCHAR(5) | NULL | Final grade (A, B, C, etc.). |
| 7 | remarks | VARCHAR(1000)| NULL | Performance comments. |
| 8 | is_locked | BOOLEAN | NOT NULL | Whether the grade is finalized. |

---

## Table 6: Academic Planner
**Description:** Scheduling data for academic activities and deadlines.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique planner entry ID. |
| 2 | title | VARCHAR(200) | NOT NULL | Activity or event title. |
| 3 | start_date | DATETIME | NOT NULL | Start timestamp. |
| 4 | end_date | DATETIME | NOT NULL | End timestamp. |
| 5 | project_id | INTEGER | FOREIGN KEY | Linked project (if any). |

---

## Table 7: Todos
**Description:** Personal task list entries for students.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique todo ID. |
| 2 | title | VARCHAR(200) | NOT NULL | Task description. |
| 3 | student_id | INTEGER | FOREIGN KEY, NOT NULL | User who owns the todo. |
| 4 | status | VARCHAR(20) | NULL | Completion status. |

---

## Table 8: Project Groups
**Description:** Groups formed for collaborative projects.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique group identifier. |
| 2 | project_id | INTEGER | FOREIGN KEY, NOT NULL | Project the group is part of. |
| 3 | name | VARCHAR(100) | NULL | Group name. |
| 4 | status | VARCHAR(20) | NULL | Active or inactive status. |

---

## Table 9: Group Members
**Description:** Mapping of students to project groups.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique membership ID. |
| 2 | group_id | INTEGER | FOREIGN KEY | The group. |
| 3 | student_id | INTEGER | FOREIGN KEY | The student member. |
| 4 | is_leader | INTEGER | NULL | Flag for group leader status. |

---

## Table 10: Contribution Logs
**Description:** Detailed tracking of individual student contributions to group tasks.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique log identifier. |
| 2 | student_id | INTEGER | FOREIGN KEY | Contributing student. |
| 3 | task_id | INTEGER | FOREIGN KEY | The task worked on. |
| 4 | contribution_weight| FLOAT | NOT NULL | Percentage or weight of contribution. |

---

## Table 11: Audit Logs
**Description:** System-wide activity tracking for security and monitoring.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique log ID. |
| 2 | user_id | INTEGER | FOREIGN KEY | User who performed the action. |
| 3 | action | VARCHAR(100) | NULL | The action performed. |
| 4 | timestamp | DATETIME | NULL | When the action occurred. |

---

## Table 12: Notifications
**Description:** Alerts and messages sent to users.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique notification ID. |
| 2 | user_id | INTEGER | FOREIGN KEY, NOT NULL | Target recipient. |
| 3 | message | VARCHAR(500) | NOT NULL | Notification content. |
| 4 | is_read | BOOLEAN | NULL | Read/unread status. |

---

## Table 13: Organizations
**Description:** High-level entities (Colleges/Universities) in the SaaS structure.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique organization ID. |
| 2 | name | VARCHAR(100) | UNIQUE, NOT NULL | Official name. |
| 3 | code | VARCHAR(50) | UNIQUE, NOT NULL | Short code identifier. |

---

## Table 14: Departments
**Description:** Academic departments within an organization.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique department ID. |
| 2 | organization_id | INTEGER | FOREIGN KEY, NOT NULL | Belonging organization. |
| 3 | name | VARCHAR(100) | NOT NULL | Department name (e.g., Computer Science). |
| 4 | code | VARCHAR(20) | NOT NULL | Department code (e.g., CSE). |

---

## Table 15: Programs
**Description:** Academic programs (e.g., B.Tech, M.Tech) offered by departments.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique program ID. |
| 2 | department_id | INTEGER | FOREIGN KEY, NOT NULL | Parent department. |
| 3 | name | VARCHAR(100) | NOT NULL | Program title. |
| 4 | type | VARCHAR(20) | NULL | Type: UG, PG, Diploma. |

---

## Table 16: Courses
**Description:** Specific courses or subjects within a program.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique course ID. |
| 2 | program_id | INTEGER | FOREIGN KEY, NOT NULL | Parent program. |
| 3 | title | VARCHAR(200) | NULL | Course title. |
| 4 | code | VARCHAR(50) | NULL | Course code. |

---

## Table 17: Academic Years
**Description:** Definitions of academic sessions.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | name | VARCHAR(50) | NOT NULL | Year range (e.g., 2025-2026). |
| 3 | status | BOOLEAN | NULL | Active session flag. |

---

## Table 18: Semesters
**Description:** Specific semesters within an academic year for a program/course.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | academic_year_id| INTEGER | FOREIGN KEY, NOT NULL | Associated year. |
| 3 | number | INTEGER | NOT NULL | Semester number (1-8). |

---

## Table 19: Faculty Allocations
**Description:** Assigning faculty members to specific academic units.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique record ID. |
| 2 | faculty_id | INTEGER | FOREIGN KEY, NOT NULL | The faculty member. |
| 3 | program_id | INTEGER | FOREIGN KEY | Assigned program. |
| 4 | course_id | INTEGER | FOREIGN KEY | Assigned course. |

---

## Table 20: Campus News
**Description:** Announcements and news articles for the campus.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | title | VARCHAR(200) | NOT NULL | News headline. |
| 3 | content | VARCHAR(2000)| NOT NULL | Full article text. |
| 4 | created_by | INTEGER | FOREIGN KEY, NOT NULL | Author ID. |

---

## Table 21: Campus Events
**Description:** Extracurricular and academic events.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | title | VARCHAR(200) | NOT NULL | Event name. |
| 3 | event_date | DATETIME | NOT NULL | Scheduled date and time. |
| 4 | status | VARCHAR(20) | NULL | Event status. |

---

## Table 22: Event Participation
**Description:** Tracks student registration and roles in events.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | student_id | INTEGER | FOREIGN KEY, NOT NULL | Participating student. |
| 3 | event_id | INTEGER | FOREIGN KEY, NOT NULL | The event. |
| 4 | role | VARCHAR(50) | NULL | Role (Participant, Volunteer, Speaker). |

---

## Table 23: Certifications
**Description:** Official certificates and badges issued to students.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | student_id | INTEGER | FOREIGN KEY, NOT NULL | Certificate holder. |
| 3 | badge_type | VARCHAR(50) | NOT NULL | Type of badge or cert. |
| 4 | issued_by | INTEGER | FOREIGN KEY, NOT NULL | Authority ID. |

---

## Table 24: Student Recognitions
**Description:** Awards and special recognition for student achievements.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | student_id | INTEGER | FOREIGN KEY, NOT NULL | Awarded student. |
| 3 | award_type | VARCHAR(50) | NOT NULL | Category of award. |
| 4 | awarded_by | INTEGER | FOREIGN KEY, NOT NULL | Issuing authority. |

---

## Table 25: Task Comments
**Description:** Discussions and comments on specific tasks.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | task_id | INTEGER | FOREIGN KEY, NOT NULL | The task. |
| 3 | user_id | INTEGER | FOREIGN KEY, NOT NULL | Commenter. |
| 4 | comment_text | TEXT | NOT NULL | The message. |

---

## Table 26: System Settings
**Description:** Key-value pairs for system-wide configurations.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | key | VARCHAR(100) | UNIQUE | Configuration key. |
| 3 | value | JSON | NULL | Configuration value. |

---

## Table 27: Roles
**Description:** User role definitions (Admin, Faculty, etc.).

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | name | VARCHAR(50) | NOT NULL | Role name. |
| 3 | is_active | BOOLEAN | NULL | Active status. |

---

## Table 28: Permissions
**Description:** Granular action permissions (e.g., 'create_task', 'delete_user').

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | code | VARCHAR(100) | UNIQUE, NOT NULL | Machine-readable code. |
| 3 | description | VARCHAR(255)| NULL | Human-readable explanation. |

---

## Table 29: Student Recommendations
**Description:** Career or academic recommendations for students.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | name | VARCHAR(100) | NOT NULL | Student name. |
| 3 | faculty_id | INTEGER | FOREIGN KEY, NOT NULL | Faculty member recommending. |
| 4 | status | VARCHAR(20) | NULL | Recommendation status. |

---

## Table 30: Sections
**Description:** Classroom sections (e.g., Section A, Section B).

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | semester_id | INTEGER | FOREIGN KEY, NOT NULL | Parent semester. |
| 3 | name | VARCHAR(10) | NOT NULL | Section identifier (A, B, C). |

---

## Table 31: Batches
**Description:** Academic batches based on intake year.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | program_id | INTEGER | FOREIGN KEY, NOT NULL | Parent program. |
| 3 | start_year | INTEGER | NOT NULL | Start of the batch. |
| 4 | end_year | INTEGER | NOT NULL | Expected completion. |

---

## Table 32: Structure Versions
**Description:** Version tracking for academic structure changes.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | entity_type | VARCHAR(50) | NOT NULL | Type of entity (Dept, Program, etc.). |
| 3 | version | INTEGER | NOT NULL | Version number. |
| 4 | changed_at | DATETIME | NULL | Timestamp of change. |

---

## Table 33: Role Permissions
**Description:** Junction table mapping roles to permissions.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | role_id | INTEGER | FOREIGN KEY, NOT NULL | The role. |
| 3 | permission_id | INTEGER | FOREIGN KEY, NOT NULL | The permission. |

---

## Table 34: Project Faculty
**Description:** Mapping of multiple faculty members to projects.

| Si No | Field Name | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | id | INTEGER | PRIMARY KEY, NOT NULL | Unique ID. |
| 2 | project_id | INTEGER | FOREIGN KEY, NOT NULL | The project. |
| 3 | faculty_id | INTEGER | FOREIGN KEY, NOT NULL | The assigned faculty. |

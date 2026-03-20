# UI Implementation Plan: Task Management System overhaul

This document summarizes the changes required to transition the current "Academia" themed project to the new "Task Management" UI design as per the provided reference screenshots.

## 1. Design System Updates

### Colors
- **Primary (Red/Orange)**: `#FF6767` (Used for buttons, active states, progress indicators)
- **Secondary (Dark/Sidebar)**: `#000000` (Main sidebar background)
- **Background**: `#F6F7F9` (Main content background, slightly off-white)
- **Card Background**: `#FFFFFF` (Clear white)
- **Status Colors**: 
    - **Extreme**: Primary Red (`#FF6767`)
    - **Moderate**: Sky Blue (`#00A3FF`)
    - **Low**: Emerald Green (`#00C853`)

### Typography
- **Main Font**: 'Outfit' (Already integrated)
- **Headings**: Semibold/Bold with tight letter spacing for a modern UI look.

---

## 2. Page Specific Implementations

### A. Authentication (Login & Register)
- **Register.js** (`Screenshot 111911.png`): 
    - Split-view layout: Left side with a large vector illustration, right side with the form.
    - Fields: First Name, Last Name, Username, Email, Password, Confirm Password.
    - modern outlined input boxes with icons.
- **Login.js** (`Screenshot 112013.png`):
    - Split-view layout: Right side with illustration, left side with the form.
    - Fields: Username/Email, Password.
    - Includes "Stay Logged In" checkbox and social login shortcuts.

### B. Global Layout (Sidebar & Header)
- **MainSidebar.js**:
    - Solid black background.
    - Top: Profile circle avatar, name, email.
    - Menu items with clear icons: Dashboard, Vital Task, My Task, Task Categories, Settings, Help.
    - Bottom: Logout button.
- **Header.js**:
    - Page Title (e.g., "Dashboard", "To-Do").
    - Centered search bar: "Search your task here..." with orange icon.
    - Top right: Notifications bell, Calendar icon, and full Date/Day display.

### C. Dashboard & Tasks
- **StudentDashboard.jsx** (`Screenshot 112120.png`):
    - Greeting section: "Welcome back, [Name]".
    - Widgets:
        - "To-Do" cards with task priority colors.
        - "Task Status" charts (3 circular progress bars: Completed, In Progress, Not Started).
        - "Completed Task" feed with small status badges and task titles.
- **My Tasks (StudentTasks.js)** (`Screenshot 112148.png`):
    - Split-screen task management: Task list cards on the left, full task details on the right.
    - Details view includes task metadata, long description, and Edit/Delete actions.

---

## 3. Implementation Phases

### Phase 1: Foundation & Global Components
1. **Color Palette**: Update `tailwind.config.js` to include the new primary and secondary colors.
2. **Sidebar & Header**: Refactor the current global layout components to match the high-contrast black/white design.
3. **Common UI**: Create reusable `TaskCard`, `StatusCircle`, and `ModalWrapper` components.

### Phase 2: Authentication Overhaul
1. Redesign `Login.js` and `Register.js` using the split-view layout.
2. Implement modern validation feedback UI as per the screenshots.

### Phase 3: Dashboard & Task Pages
1. Redesign `StudentDashboard` and `FacultyDashboard` widgets.
2. Implement the split-view layout for task lists with detail panes.
3. Implement the new "Add Task" and "Invite" modals.

### Phase 4: Polish & Refinement
1. Add micro-animations (framer-motion) for modal transitions and task card hover states.
2. Ensure full accessibility and responsive behavior for mobile views.

---
*Please review this plan. You can edit this file directly to add specific requirements or changes.*

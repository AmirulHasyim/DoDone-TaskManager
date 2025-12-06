# DoDone Web Application (IMS566)

A simple, **fully functional** front-end DoDone prototype developed for IMS566 - Advanced Web Design Development and Content Management.

## Features
- **Full Task Management (CRUD)**: Users can Add, Edit, Delete, Filter, and View Tasks.
- **Dynamic Status Tracking**: Tasks automatically update status (Overdue, Due Today, Pending, Submitted, Completed) based on the deadline.
- **Task Submission Logic**: Users can submit an assignment file for a task (simulated file storage).
- **Full Category Management (CRUD)**: Users can Add, Edit, and Delete categories, which dynamically populate the Task form.
- **User Profile Management**: Full functionality to update full name, matric number, role, and change password.
- **Theme Toggle**: Functioning Dark Mode and Light Mode with persistence across sessions.
- Dashboard with summary cards and Chart.js visualization.
- Responsive layout with Bootstrap 5.
- Login authentication (simulated with hardcoded credentials).

## Login (demo)
Use the following credentials to login:

| Field | Value |
| :--- | :--- |
| **Username** | `student` |
| **Password** | `123456` |

## How to run locally
1. Extract the project folder.
2. Open `index.html` in Google Chrome.
3. Login with the demo credentials above.

## Deployment
1. Create a new GitHub repository (public or private).
2. Push the project files to the repository root.
3. In GitHub repository settings -> Pages, select the main branch root and publish.
4. Your site will be available at `https://username.github.io/reponame/`

## Libraries used
- Bootstrap 5 (CDN)
- Chart.js (CDN)

## Notes
- This is a **feature-complete front-end prototype**. All application data (tasks, categories, user profile) is stored locally in the browser's `localStorage` and persists between sessions.
- For a real-world application, you would connect these pages to a backend and database.

## Author
Amirul Hasyim bin Muhammad Asri
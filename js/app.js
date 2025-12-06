// DoDone Task Management Application Logic
(function(){
  // --- Initialization and Helper Functions ---
  
  const el = (id) => document.getElementById(id);
  
  // Global elements used across pages
  const tasksTableBody = el('tasksTableBody');
  const categoriesTableBody = el('categoriesTableBody');
  const categoryModalElement = el('categoryModal');
  const taskModalElement = el('taskModal');
  const submitModalElement = el('submitModal');
  const filterStatusEl = el('filterStatus');
  const filterCategoryEl = el('filterCategory');
  const filterPriorityEl = el('filterPriority');
  const dashboardCanvas = el('taskChart');

  // Helper for safe localStorage retrieval
  function safeGet(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return defaultValue;
    }
  }

  // Helper to determine the status of a task
  function getDeadlineStatus(deadline, currentStatus) {
    if (currentStatus === 'Completed' || currentStatus === 'Submitted') {
        return currentStatus;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0); 

    const timeDiff = deadlineDate.getTime() - today.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);

    if (dayDiff < 0) {
        return 'Overdue';
    } else if (dayDiff === 0) {
        return 'Due Today';
    } else if (dayDiff === 1) {
        return 'Due Tomorrow';
    } else {
        return 'Pending';
    }
  }


  // --- Data Access and Persistence (Local Storage) ---

  function getTasks() {
    // ... (Existing implementation to get/sort tasks)
    const defaultTasks = [
        { id: 1, name: 'Setup Project Repository', desc: 'Initialize git repository and basic folder structure.', category: 'Project', deadline: '2025-06-15', priority: 'High', status: 'Pending', submissionFile: null },
        { id: 2, name: 'Design Database Schema', desc: 'Outline the tables, fields, and relationships for the main database.', category: 'Project', deadline: '2025-06-20', priority: 'High', status: 'Completed', submissionFile: null },
        { id: 3, name: 'Write Introduction Chapter', desc: 'Draft the first chapter of the semester assignment.', category: 'Assignment', deadline: '2025-06-25', priority: 'Medium', status: 'Submitted', submissionFile: 'intro.pdf' },
        { id: 4, name: 'Review Literature', desc: 'Collect and summarize 10 relevant academic papers.', category: 'Research', deadline: '2025-07-01', priority: 'Low', status: 'Pending', submissionFile: null },
        { id: 5, name: 'Old History Report', desc: 'A task for testing the Overdue status.', category: 'Assignment', deadline: '2025-05-30', priority: 'High', status: 'Pending', submissionFile: null },
    ];
    let tasks = safeGet('tm_tasks', defaultTasks);
    
    tasks = tasks.map(t => ({
        ...t, 
        category: t.category || 'Uncategorized', 
        desc: t.desc || '',
        status: getDeadlineStatus(t.deadline, t.status) 
    }));
    
    // Sort logic...
    tasks.sort((a, b) => {
        const statusOrder = { 'Overdue': 0, 'Due Today': 1, 'Due Tomorrow': 2, 'Pending': 3, 'Submitted': 4, 'Completed': 5 };
        const statusA = getDeadlineStatus(a.deadline, a.status);
        const statusB = getDeadlineStatus(b.deadline, b.status);

        if (statusOrder[statusA] !== statusOrder[statusB]) {
            return statusOrder[statusA] - statusOrder[statusB];
        }

        if (statusA !== 'Completed' && statusA !== 'Submitted') {
             return new Date(a.deadline) - new Date(b.deadline);
        }
        return a.id - b.id; 
    });

    return tasks;
  }
  
  function saveTasks(tasks) {
      localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  }
  
  function getCategories() {
    const defaultCategories = [
        { id: 1, name: 'Project', desc: 'Tasks related to large-scale semester projects.' },
        { id: 2, name: 'Assignment', desc: 'Standard homework and weekly assignments.' },
        { id: 3, name: 'Research', desc: 'Literature review, data collection, and analysis.' },
        { id: 4, name: 'Study', desc: 'Exam preparation and general reading.' },
    ];
    return safeGet('tm_categories', defaultCategories);
  }
  
  function saveCategories(categories) {
      localStorage.setItem('tm_categories', JSON.stringify(categories));
  }
  
  function getUsers() {
      // Note: profilePic is removed from logic, but preserved if it exists in old data, though it's not used.
      const defaultUsers = [{ 
          username: 'student', 
          password: '123456', 
          fullName: 'Student User', 
          matricNo: '2023000000', 
          role: 'Degree'
      }];
      return safeGet('tm_users', defaultUsers);
  }

  function saveUsers(users) {
      localStorage.setItem('tm_users', JSON.stringify(users));
  }

  function getCurrentUser() {
      return safeGet('tm_currentUser', null);
  }

  function setCurrentUser(user) {
      // Ensure we don't store profilePic key if it exists, for consistency (removed feature)
      const sanitizedUser = { 
        username: user.username, 
        password: user.password, 
        fullName: user.fullName, 
        matricNo: user.matricNo, 
        role: user.role
      };
      localStorage.setItem('tm_currentUser', JSON.stringify(sanitizedUser));
  }
  
  // --- Authentication ---
  
  function login(username, password) {
      const users = getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
          setCurrentUser(user);
          return user;
      }
      return null;
  }
  
  function registerUser(username, fullName, matricNo, role, password) {
      const users = getUsers();

      if (users.find(u => u.username === username)) {
          return { success: false, message: 'Username already exists.' };
      }

      const newUser = {
          username: username,
          password: password, 
          fullName: fullName,
          matricNo: matricNo,
          role: role,
          // profilePic property is intentionally omitted/ignored
      };
      
      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser); 
      return { success: true, user: newUser };
  }

  function logout() {
      localStorage.removeItem('tm_currentUser');
      window.location.href = 'index.html';
  }

  function checkAuth() {
      const user = getCurrentUser();
      const path = window.location.pathname;
      const isAuthPage = path.includes('index.html') || path.includes('register.html');
      const requiresAuth = !isAuthPage;

      if (requiresAuth && !user) {
          window.location.href = 'index.html';
      } else if (isAuthPage && user) {
          window.location.href = 'dashboard.html';
      }
      // Update Navbar Username on all secured pages
      if (user && el('navUsername')) {
          el('navUsername').textContent = user.fullName || user.username;
      }
  }

  // --- Task Submission ---
  function submitTask(event) {
      event.preventDefault();
      // This is the submission logic that was previously commented out and is now implemented
      const taskId = parseInt(el('submitTaskId').value);
      // Simulate file upload by checking if a file is selected
      const assignmentFile = el('assignmentFile').files[0];
      const submissionMessageEl = el('submissionMessage');
      
      submissionMessageEl.classList.add('d-none');
      
      if (!assignmentFile) {
          submissionMessageEl.textContent = 'Please select a file to upload.';
          submissionMessageEl.classList.remove('d-none', 'alert-success');
          submissionMessageEl.classList.add('alert-danger');
          return;
      }

      let tasks = getTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
          tasks[taskIndex].status = 'Submitted';
          tasks[taskIndex].submissionFile = assignmentFile.name; // Store file name as placeholder
          saveTasks(tasks);
          
          submissionMessageEl.textContent = `Successfully submitted file: ${assignmentFile.name} for Task ID ${taskId}.`;
          submissionMessageEl.classList.remove('d-none', 'alert-danger');
          submissionMessageEl.classList.add('alert-success');
          
          // Close modal after a delay and refresh tasks list
          setTimeout(() => {
              const submitModalInstance = bootstrap.Modal.getInstance(submitModalElement);
              if (submitModalInstance) submitModalInstance.hide();
              renderTasks(); // Refresh list
              if (typeof renderDashboardStats === 'function') renderDashboardStats();
          }, 1500);
      } else {
          submissionMessageEl.textContent = 'Error: Task not found.';
          submissionMessageEl.classList.remove('d-none', 'alert-success');
          submissionMessageEl.classList.add('alert-danger');
      }
  }


  // --- Category Management (NEWLY COMPLETED CRUD) ---
  
  function prepareCategoryModal(categoryId) {
    const isEdit = categoryId !== null;
    el('categoryModalLabel').textContent = isEdit ? 'Edit Category' : 'Add New Category';
    el('categoryId').value = isEdit ? categoryId : '';
    el('categoryName').value = '';
    el('categoryDesc').value = '';

    if (isEdit) {
        const categories = getCategories();
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            el('categoryName').value = category.name;
            el('categoryDesc').value = category.desc;
        }
    }
  }

  function renderCategories() {
    const categories = getCategories();
    if (categoriesTableBody) {
        categoriesTableBody.innerHTML = '';
        categories.forEach(category => {
            const row = categoriesTableBody.insertRow();
            row.innerHTML = `
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.desc}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Actions
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item edit-category" data-id="${category.id}" data-bs-toggle="modal" data-bs-target="#categoryModal" href="#">Edit</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger delete-category" data-id="${category.id}" href="#">Delete</a></li>
                        </ul>
                    </div>
                </td>
            `;
        });
        
        // Attach listeners dynamically
        document.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                prepareCategoryModal(id);
            });
        });
        
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Are you sure you want to delete this category? This cannot be undone.')) {
                    deleteCategory(id);
                }
            });
        });
    }
  }

  function saveCategory(event) {
    event.preventDefault();
    
    const id = el('categoryId').value ? parseInt(el('categoryId').value) : null;
    const name = el('categoryName').value.trim();
    const desc = el('categoryDesc').value.trim();
    
    let categories = getCategories();
    
    if (id) {
        // Edit mode
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index].name = name;
            categories[index].desc = desc;
        }
    } else {
        // Add mode
        const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
        categories.push({ id: newId, name: name, desc: desc });
    }
    
    saveCategories(categories);
    const categoryModalInstance = bootstrap.Modal.getInstance(categoryModalElement);
    if (categoryModalInstance) categoryModalInstance.hide();
    renderCategories(); // Refresh list
    // You should also call renderTasks here if the tasks page is open, but for simplicity, we focus on the current page
    if (typeof renderTasks === 'function') renderTasks(); // Call if available
  }

  function deleteCategory(id) {
    let categories = getCategories();
    categories = categories.filter(c => c.id !== id);
    saveCategories(categories);
    renderCategories();
    if (typeof renderTasks === 'function') renderTasks();
  }

  // --- Profile Management (UPDATED LOGIC) ---
  
  function renderProfile() {
    const user = getCurrentUser();
    if (!user || !el('profileFullName')) return;

    // Display basic info
    el('profileFullName').textContent = user.fullName;
    el('profileRole').textContent = user.role;
    el('profileUsername').textContent = user.username;
    // Note: Profile Picture elements are removed in profile.html

    // Populate form fields
    el('newFullName').value = user.fullName;
    el('newMatricNo').value = user.matricNo;
    el('newRole').value = user.role;
    
    // Clear password fields on load
    el('currentPassword').value = '';
    el('newPassword').value = '';
    el('confirmPassword').value = '';
    el('profileSuccess').classList.add('d-none');
    el('profileError').classList.add('d-none');
    el('passwordError').classList.add('d-none');
  }

  function saveProfile(event) {
    event.preventDefault();

    const currentUser = getCurrentUser();
    if (!currentUser) {
        el('profileError').textContent = "User session expired. Please log in.";
        el('profileError').classList.remove('d-none');
        return;
    }

    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === currentUser.username);

    if (userIndex === -1) {
        el('profileError').textContent = "User not found in database.";
        el('profileError').classList.remove('d-none');
        return;
    }

    // Update general fields
    users[userIndex].fullName = el('newFullName').value.trim();
    users[userIndex].matricNo = el('newMatricNo').value.trim();
    users[userIndex].role = el('newRole').value;

    // Handle Password Change
    const currentPass = el('currentPassword').value;
    const newPass = el('newPassword').value;
    const confirmPass = el('confirmPassword').value;

    // Reset messages
    el('profileSuccess').classList.add('d-none');
    el('profileError').classList.add('d-none');
    el('passwordError').classList.add('d-none');

    if (newPass || currentPass || confirmPass) {
        if (!currentPass || !newPass || !confirmPass) {
            el('profileError').textContent = "To change your password, you must fill in Current, New, and Confirmation passwords.";
            el('profileError').classList.remove('d-none');
            return;
        }
        if (newPass !== confirmPass) {
            el('passwordError').textContent = "New password and confirmation password do not match.";
            el('passwordError').classList.remove('d-none');
            return;
        }
        if (currentUser.password !== currentPass) {
            el('profileError').textContent = "The current password entered is incorrect.";
            el('profileError').classList.remove('d-none');
            return;
        }
        if (newPass.length < 6) {
             el('profileError').textContent = "New password must be at least 6 characters long.";
            el('profileError').classList.remove('d-none');
            return;
        }

        // Successfully updated password
        users[userIndex].password = newPass;
    }

    // Save changes
    saveUsers(users);
    // Update currentUser in session (important for new name/role/password)
    setCurrentUser(users[userIndex]);

    el('profileSuccess').classList.remove('d-none');
    // Re-render profile data
    renderProfile(); 
  }

  // --- Theme Toggle ---
  function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('light-mode');
    localStorage.setItem('tm_theme', isDarkMode ? 'light-mode' : 'dark-mode');
    if (typeof renderDashboardStats === 'function') renderDashboardStats(); 
  }
  
  function applyTheme() {
    const theme = localStorage.getItem('tm_theme') || 'dark-mode';
    document.body.classList.remove('light-mode'); 
    if (theme === 'light-mode') {
        document.body.classList.add('light-mode');
    }
  }

  // --- Task Management Functions (UPDATED) ---

  function populateCategoryDropdowns() {
    const categories = getCategories();
    const filterSelect = el('filterCategory');
    const taskSelect = el('taskCategory');

    // 1. Clear and populate the Filter dropdown (#filterCategory)
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Categories</option>'; 
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            filterSelect.appendChild(option);
        });
    }

    // 2. Clear and populate the Task Modal dropdown (#taskCategory)
    if (taskSelect) {
        taskSelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            taskSelect.appendChild(option);
        });
    }
  }

  function prepareTaskModal(taskId) {
    const isEdit = taskId !== null;
    el('taskModalLabel').textContent = isEdit ? 'Edit Task' : 'Add New Task';
    el('taskId').value = isEdit ? taskId : '';
    el('taskName').value = '';
    el('taskDesc').value = '';
    el('taskCategory').value = '';
    el('taskDeadline').value = '';
    el('taskPriority').value = 'Medium';
    
    if (isEdit) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            el('taskName').value = task.name;
            el('taskDesc').value = task.desc;
            el('taskCategory').value = task.category;
            // The deadline input requires YYYY-MM-DD format
            el('taskDeadline').value = task.deadline; 
            el('taskPriority').value = task.priority;
        }
    }
    // Ensure categories are populated before showing modal
    populateCategoryDropdowns();
  }


  function renderTasks(filters = {}) {
    // FIX: Populate Category dropdowns first
    populateCategoryDropdowns(); 

    let tasks = getTasks();
    const tableBody = el('tasksTableBody');
    if (!tableBody) return;
    
    // Get filter element values (must check if they exist on the page)
    const filterStatusValue = filterStatusEl?.value || '';
    const filterCategoryValue = filterCategoryEl?.value || '';
    const filterPriorityValue = filterPriorityEl?.value || '';
    
    // --- Filtering Logic ---
    tasks = tasks.filter(task => {
        // Status Filter
        if (filterStatusValue && task.status !== filterStatusValue) {
            return false;
        }
        // Category Filter
        if (filterCategoryValue && task.category !== filterCategoryValue) {
            return false;
        }
        // Priority Filter
        if (filterPriorityValue && task.priority !== filterPriorityValue) {
            return false;
        }
        return true;
    });

    tableBody.innerHTML = '';
    
    if (tasks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No tasks found matching current filters.</td></tr>';
        return;
    }

    // --- Rendering Logic ---
    tasks.forEach(task => {
        let statusClass = '';
        let rowClass = '';
        switch (task.status) {
            case 'Overdue':
                statusClass = 'bg-danger';
                rowClass = 'table-overdue-soft';
                break;
            case 'Due Today':
            case 'Due Tomorrow':
            case 'Pending':
                statusClass = 'bg-info';
                rowClass = 'table-pending-soft';
                break;
            case 'Submitted':
                statusClass = 'bg-primary';
                rowClass = 'table-submitted-soft';
                break;
            case 'Completed':
                statusClass = 'bg-success';
                rowClass = 'table-completed-soft';
                break;
            default:
                statusClass = 'bg-secondary';
                break;
        }

        const deadlineDate = new Date(task.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        const row = tableBody.insertRow();
        row.classList.add(rowClass);
        
        const isSubmittable = task.status !== 'Completed' && task.status !== 'Submitted';
        const actionButton = isSubmittable 
            ? `<button class="btn btn-sm btn-info submit-task-btn" data-id="${task.id}" data-bs-toggle="modal" data-bs-target="#submitModal">Submit</button>`
            : `<button class="btn btn-sm btn-secondary" disabled>Submitted</button>`;

        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.category}</td>
            <td>${deadlineDate}</td>
            <td><span class="badge bg-secondary">${task.priority}</span></td>
            <td><span class="badge ${statusClass}">${task.status}</span></td>
            <td>
                <div class="d-flex gap-2">
                    ${actionButton}
                    <button class="btn btn-sm btn-warning edit-task-btn" data-id="${task.id}" data-bs-toggle="modal" data-bs-target="#taskModal">Edit</button>
                    <button class="btn btn-sm btn-danger delete-task-btn" data-id="${task.id}">Delete</button>
                </div>
            </td>
        `;
    });

    // Attach listeners for filtering and task actions (delete/edit/submit)
    filterStatusEl?.addEventListener('change', renderTasks);
    filterCategoryEl?.addEventListener('change', renderTasks);
    filterPriorityEl?.addEventListener('change', renderTasks);

    // Helper handlers to manage listeners cleanly
    const handleDeleteTask = (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(id);
        }
    };
    const handleEditTask = (e) => {
        const id = parseInt(e.target.dataset.id);
        prepareTaskModal(id);
    };
    const prepareSubmitModal = (e) => {
        const id = parseInt(e.target.dataset.id);
        const task = getTasks().find(t => t.id === id);
        if(task) {
            el('submitTaskId').value = id;
            el('submitTaskIdDisplay').textContent = id;
            el('submitTaskNameDisplay').textContent = task.name;
            el('submissionMessage').classList.add('d-none'); // Reset message
            el('assignmentFile').value = ''; // Clear file input
        }
    };
    
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteTask);
    });

    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', handleEditTask);
    });
    
    document.querySelectorAll('.submit-task-btn').forEach(btn => {
        btn.addEventListener('click', prepareSubmitModal);
    });
  }


  function saveTask(event) { 
      event.preventDefault();
      
      const id = el('taskId').value ? parseInt(el('taskId').value) : null;
      const name = el('taskName').value.trim();
      const desc = el('taskDesc').value.trim();
      const category = el('taskCategory').value;
      const deadline = el('taskDeadline').value;
      const priority = el('taskPriority').value;
      
      let tasks = getTasks();
      
      if (!name || !category || !deadline || !priority) {
        alert('Please fill in all required task fields.');
        return;
      }
      
      if (id) {
          // Edit mode
          const index = tasks.findIndex(t => t.id === id);
          if (index !== -1) {
              tasks[index].name = name;
              tasks[index].desc = desc;
              tasks[index].category = category;
              tasks[index].deadline = deadline;
              tasks[index].priority = priority;
              // Status will be recalculated on getTasks()
          }
      } else {
          // Add mode
          const newId = tasks.length > 0 ? Math.max(...tasks.map(c => c.id)) + 1 : 1;
          const newTask = { 
              id: newId, 
              name: name, 
              desc: desc, 
              category: category, 
              deadline: deadline, 
              priority: priority, 
              status: 'Pending', // Initial status (re-calculated by getTasks)
              submissionFile: null 
          };
          tasks.push(newTask);
      }
      
      saveTasks(tasks);
      const taskModalInstance = bootstrap.Modal.getInstance(taskModalElement);
      if (taskModalInstance) taskModalInstance.hide();
      renderTasks(); // Refresh list

      // Call dashboard update if available
      if (typeof renderDashboardStats === 'function') renderDashboardStats(); 
  }

  function deleteTask(id) { 
      let tasks = getTasks();
      tasks = tasks.filter(t => t.id !== id);
      saveTasks(tasks);
      renderTasks();
      if (typeof renderDashboardStats === 'function') renderDashboardStats(); 
  }
  
  // --- Dashboard Functions (Implementation) ---

  function renderDashboardStats() { 
    const tasks = getTasks();
    const categories = getCategories();
    
    const stats = {
        totalTasks: tasks.length,
        totalCategories: categories.length,
        overdue: tasks.filter(t => t.status === 'Overdue').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        submitted: tasks.filter(t => t.status === 'Submitted').length,
        pending: tasks.filter(t => t.status === 'Pending' || t.status === 'Due Today' || t.status === 'Due Tomorrow').length,
    };

    // Update stat cards (must check if elements exist)
    if (el('totalTasks')) el('totalTasks').textContent = stats.totalTasks;
    if (el('overdueTasks')) el('overdueTasks').textContent = stats.overdue;
    if (el('completedTasks')) el('completedTasks').textContent = stats.completed;
    if (el('submittedTasks')) el('submittedTasks').textContent = stats.submitted;
    if (el('pendingTasks')) el('pendingTasks').textContent = stats.pending;
    if (el('totalCategories')) el('totalCategories').textContent = stats.totalCategories;
    
    // Render the chart
    createTaskChart(stats);
  }
  
  let chartInstance = null; // To hold the chart instance
  function createTaskChart(stats) { 
    // Check for Chart.js library before proceeding
    if (!dashboardCanvas || typeof Chart === 'undefined') return;

    const ctx = dashboardCanvas.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Check theme for color selection
    const isDarkMode = !document.body.classList.contains('light-mode');
    const textColor = isDarkMode ? '#EAEAEA' : '#212529'; // --dodone-text-light

    chartInstance = new Chart(ctx, {
        type: 'pie', // Pie chart for simple status distribution
        data: {
            labels: ['Overdue', 'Pending', 'Submitted', 'Completed'],
            datasets: [{
                data: [stats.overdue, stats.pending, stats.submitted, stats.completed],
                backgroundColor: [
                    'rgba(240, 84, 84, 0.8)',      // danger (Overdue)
                    'rgba(0, 240, 255, 0.8)',      // info/accent (Pending)
                    'rgba(166, 169, 248, 0.8)',    // primary/info (Submitted)
                    'rgba(100, 255, 218, 0.8)'     // success (Completed)
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });
  }
  // --- End Task and Dashboard Functions ---


  // --- Event Listeners and Initializers ---

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); 

    // Handle password visibility toggle for all pages
    document.querySelectorAll('.password-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        if (input.type === 'password') {
          input.type = 'text';
          toggle.textContent = '🙈';
        } else {
          input.type = 'password';
          toggle.textContent = '👁️';
        }
      });
    });

    checkAuth(); 

    if (el('logoutBtn')) el('logoutBtn').addEventListener('click', logout);
    if (el('themeToggle')) el('themeToggle').addEventListener('click', toggleTheme);

    // LOGIN PAGE INIT (CENTRALIZED)
    const loginForm = el('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = el('username').value.trim();
            const password = el('password').value;
            const errorBox = el('loginError');

            errorBox.classList.add("d-none");

            const user = login(username, password);

            if (user) {
                window.location.href = 'dashboard.html';
            } else {
                errorBox.textContent = "Invalid username or password.";
                errorBox.classList.remove("d-none");
            }
        });
    }
    
    // REGISTER PAGE INIT (CENTRALIZED)
    const registerForm = el('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
           e.preventDefault();
            const username = el('regUsername').value.trim();
            const fullName = el('regFullName').value.trim();
            const matricNo = el('regMatricNo').value.trim();
            const role = el('regRole').value;
            const password = el('regPassword').value;
            const confirmPassword = el('regConfirmPassword').value;
            const errorBox = el('registerError');
            
            errorBox.classList.add("d-none");

            if (password !== confirmPassword) {
                errorBox.textContent = "Passwords do not match.";
                errorBox.classList.remove("d-none");
                return;
            }
            
            if (password.length < 6) {
                 errorBox.textContent = "Password must be at least 6 characters long.";
                errorBox.classList.remove("d-none");
                return;
            }
            
            const result = registerUser(username, fullName, matricNo, role, password);

            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                errorBox.textContent = result.message;
                errorBox.classList.remove("d-none");
            }
        });
    }

    // TASKS PAGE INIT
    if (tasksTableBody) {
        if (typeof renderTasks === 'function') renderTasks(); 
        if (el('taskForm')) el('taskForm').addEventListener('submit', saveTask); 
        const submissionForm = el('submissionForm');
        if (submissionForm) submissionForm.addEventListener('submit', submitTask);
        
        // Listener for Add New Task button (to reset modal for "Add" mode)
        el('addTaskBtn')?.addEventListener('click', () => prepareTaskModal(null));
    }

    // CATEGORIES PAGE INIT (COMPLETED)
    if (categoriesTableBody) {
        renderCategories();
        if (el('categoryForm')) el('categoryForm').addEventListener('submit', saveCategory);
        // Listener for Add New Category button (to reset modal for "Add" mode)
        el('addCategoryBtn')?.addEventListener('click', () => prepareCategoryModal(null));
    }


    // DASHBOARD PAGE INIT
    if (dashboardCanvas) {
        // Need to load Chart.js library before calling this!
        // Assuming Chart.js is loaded in dashboard.html via <script> tag before app.js
        if (typeof renderDashboardStats === 'function') renderDashboardStats();
    }

    // PROFILE PAGE INIT (COMPLETED)
    if (el('profileUsername')) {
        renderProfile();
        if (el('profileForm')) el('profileForm').addEventListener('submit', saveProfile);
    }
  });

  // Export core functions to the global scope
  window.loginUser = login; 
  window.registerUser = registerUser;
  window.logout = logout;
  window.getCurrentUser = getCurrentUser;
  window.checkAuth = checkAuth;
  window.toggleTheme = toggleTheme;
  window.renderTasks = renderTasks;
  window.renderCategories = renderCategories;
  window.renderProfile = renderProfile;
  window.renderDashboardStats = renderDashboardStats;
})();
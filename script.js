// ======================
// DOM Elements
// ======================
const themeSwitch = document.getElementById('themeSwitch');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const closeModal = document.querySelector('.close');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const taskInput = document.getElementById('taskInput');
const taskCategory = document.getElementById('taskCategory');
const taskDateTime = document.getElementById('taskDateTime');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTaskBtn');
const filterCategory = document.getElementById('filterCategory');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const searchInput = document.getElementById('searchInput');
const taskList = document.getElementById('taskList');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const progressBar = document.getElementById('progressBar');
const categoryList = document.getElementById('categoryList');
const categoryNameInput = document.getElementById('categoryName');
const categoryColorInput = document.getElementById('categoryColor');
const toast = document.getElementById('toast');
const emptyState = document.getElementById('emptyState');
const editTaskModal = document.getElementById('editTaskModal');
const closeEditModal = document.querySelector('.close-edit');
const editTaskText = document.getElementById('editTaskText');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDateTime = document.getElementById('editTaskDateTime');
const saveEditBtn = document.getElementById('saveEditBtn');
let currentEditIndex = null;

// ======================
// Data
// ======================
let categories = JSON.parse(localStorage.getItem('categories')) || [
  { name: 'work', color: '#4a6dff' },
  { name: 'personal', color: '#ff6b6b' },
  { name: 'home', color: '#51cf66' },
  { name: 'other', color: '#fcc419' }
];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let draggedIndex = null;

// ======================
// Theme Toggle
// ======================
themeSwitch.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', themeSwitch.checked);
});
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  themeSwitch.checked = true;
}

// ======================
// Category Management
// ======================
function updateCategoryDropdowns() {
  [taskCategory, filterCategory, editTaskCategory].forEach(select => {
    select.innerHTML = '<option value="">Category</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
      select.appendChild(option);
    });
  });
}

function renderCategoryList() {
  categoryList.innerHTML = '';
  categories.forEach((cat, index) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="category-color" style="background: ${cat.color};"></span>
        <span>${cat.name}</span>
      </div>
      <div class="category-actions">
        <button class="delete-category-btn" data-index="${index}">Delete</button>
      </div>
    `;
    categoryList.appendChild(item);
  });
  document.querySelectorAll('.delete-category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteCategory(parseInt(this.getAttribute('data-index')));
    });
  });
}

function deleteCategory(index) {
  const catName = categories[index].name;
  if (confirm(`Delete category "${catName}"? Tasks will lose this category.`)) {
    categories.splice(index, 1);
    tasks.forEach(task => {
      if (task.category === catName) task.category = '';
    });
    saveData();
    updateCategoryDropdowns();
    renderCategoryList();
    renderTasks();
    showToast(`Category "${catName}" deleted!`);
  }
}

addCategoryBtn.addEventListener('click', () => {
  renderCategoryList();
  categoryModal.style.display = 'flex';
});
closeModal.addEventListener('click', () => {
  categoryModal.style.display = 'none';
});
saveCategoryBtn.addEventListener('click', () => {
  const name = categoryNameInput.value.trim().toLowerCase();
  const color = categoryColorInput.value;
  if (name && !categories.some(c => c.name === name)) {
    categories.push({ name, color });
    saveData();
    updateCategoryDropdowns();
    renderCategoryList();
    categoryModal.style.display = 'none';
    categoryNameInput.value = '';
    showToast('Category added!');
  }
});

// ======================
// Task Management
// ======================
function renderTasks() {
  const categoryFilter = filterCategory.value;
  const priorityFilter = filterPriority.value;
  const statusFilter = filterStatus.value;
  const searchTerm = searchInput.value.toLowerCase();

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = !categoryFilter || task.category === categoryFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'completed' && task.completed) || 
      (statusFilter === 'pending' && !task.completed);
    const matchesSearch = !searchTerm || 
      task.text.toLowerCase().includes(searchTerm) || 
      (task.category && task.category.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });

  taskList.innerHTML = '';
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }

  filteredTasks.forEach((task, index) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');
    li.draggable = true;
    li.dataset.index = index;

    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';

    if (task.category) {
      const category = categories.find(c => c.name === task.category);
      const categorySpan = document.createElement('span');
      categorySpan.className = 'task-category';
      categorySpan.textContent = task.category;
      categorySpan.style.backgroundColor = category?.color || '#4a6dff';
      taskMeta.appendChild(categorySpan);
    }

    const prioritySpan = document.createElement('span');
    prioritySpan.className = `task-priority priority-${task.priority || 'medium'}`;
    const priorityIcon = document.createElement('i');
    if (task.priority === 'high') priorityIcon.className = 'fas fa-exclamation-circle';
    else if (task.priority === 'medium') priorityIcon.className = 'fas fa-exclamation';
    else priorityIcon.className = 'fas fa-arrow-down';
    prioritySpan.appendChild(priorityIcon);
    prioritySpan.appendChild(document.createTextNode(task.priority || 'medium'));
    taskMeta.appendChild(prioritySpan);

    if (task.date) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      const now = new Date();
      const dueDate = new Date(task.date);
      dateSpan.textContent = 'Due: ' + dueDate.toLocaleString();
      if (dueDate < now && !task.completed) {
        dateSpan.classList.add('overdue');
        dateSpan.innerHTML += ' <i class="fas fa-exclamation-triangle"></i>';
      }
      taskMeta.appendChild(dateSpan);
    }

    taskContent.appendChild(taskText);
    taskContent.appendChild(taskMeta);
    li.appendChild(taskContent);

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const completeBtn = document.createElement('button');
    completeBtn.className = 'completeBtn';
    completeBtn.innerHTML = task.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
    completeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleComplete(index);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'editBtn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(index);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'deleteBtn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDelete(index);
    });

    taskActions.appendChild(completeBtn);
    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);
    li.appendChild(taskActions);

    li.addEventListener('click', (e) => {
      if (e.target === li || e.target === taskText || e.target === taskMeta) {
        toggleComplete(index);
      }
    });

    li.addEventListener('dragstart', () => {
      draggedIndex = index;
      setTimeout(() => li.classList.add('dragging'), 0);
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIndex = filteredTasks.findIndex((_, i) => i === parseInt(e.currentTarget.dataset.index));
      if (draggedIndex !== null && targetIndex !== -1) {
        const originalIndex = tasks.indexOf(filteredTasks[draggedIndex]);
        const targetOriginalIndex = tasks.indexOf(filteredTasks[targetIndex]);
        if (originalIndex !== -1 && targetOriginalIndex !== -1) {
          [tasks[originalIndex], tasks[targetOriginalIndex]] = [tasks[targetOriginalIndex], tasks[originalIndex]];
          saveData();
          renderTasks();
          showToast('Task reordered!');
        }
      }
    });

    taskList.appendChild(li);
  });

  // Update stats
  totalTasksEl.textContent = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  completedTasksEl.textContent = completedCount;
  progressBar.style.width = tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%';
}

function addTask() {
  const text = taskInput.value.trim();
  if (text) {
    tasks.push({
      text,
      category: taskCategory.value || null,
      date: taskDateTime.value || null,
      priority: taskPriority.value,
      completed: false
    });
    taskInput.value = '';
    taskCategory.value = '';
    taskDateTime.value = '';
    taskPriority.value = 'medium';
    saveData();
    renderTasks();
    showToast('Task added!');
  }
}

function toggleComplete(index) {
  const filteredTasks = getFilteredTasks();
  const originalIndex = tasks.indexOf(filteredTasks[index]);
  tasks[originalIndex].completed = !tasks[originalIndex].completed;
  saveData();
  renderTasks();
  showToast('Task updated!');
}

function getFilteredTasks() {
  const categoryFilter = filterCategory.value;
  const priorityFilter = filterPriority.value;
  const statusFilter = filterStatus.value;
  const searchTerm = searchInput.value.toLowerCase();

  return tasks.filter(task => {
    const matchesCategory = !categoryFilter || task.category === categoryFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'completed' && task.completed) || 
      (statusFilter === 'pending' && !task.completed);
    const matchesSearch = !searchTerm || 
      task.text.toLowerCase().includes(searchTerm) || 
      (task.category && task.category.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });
}

function openEditModal(index) {
  const filteredTasks = getFilteredTasks();
  const originalIndex = tasks.indexOf(filteredTasks[index]);
  const task = tasks[originalIndex];
  currentEditIndex = originalIndex;
  editTaskText.value = task.text;
  editTaskCategory.value = task.category || '';
  editTaskPriority.value = task.priority || 'medium';
  editTaskDateTime.value = task.date || '';
  editTaskModal.style.display = 'flex';
}

function saveEditTask() {
  if (currentEditIndex !== null) {
    const text = editTaskText.value.trim();
    if (text === '') {
      showToast('Task description cannot be empty!');
      return;
    }
    tasks[currentEditIndex].text = text;
    tasks[currentEditIndex].category = editTaskCategory.value || null;
    tasks[currentEditIndex].priority = editTaskPriority.value;
    tasks[currentEditIndex].date = editTaskDateTime.value || null;
    saveData();
    renderTasks();
    editTaskModal.style.display = 'none';
    currentEditIndex = null;
    showToast('Task updated!');
  }
}

function confirmDelete(index) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Delete Task</h2>
      <p>Are you sure you want to delete this task?</p>
      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button id="confirmDeleteBtn" class="btn primary">Delete</button>
        <button id="cancelDeleteBtn" class="btn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    const filteredTasks = getFilteredTasks();
    const originalIndex = tasks.indexOf(filteredTasks[index]);
    tasks.splice(originalIndex, 1);
    saveData();
    renderTasks();
    showToast('Task deleted!');
    modal.remove();
  });
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => modal.remove());
}

// ======================
// Filtering and Searching
// ======================
filterCategory.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);
clearFiltersBtn.addEventListener('click', () => {
  filterCategory.value = '';
  filterPriority.value = '';
  filterStatus.value = '';
  searchInput.value = '';
  renderTasks();
});
searchInput.addEventListener('input', renderTasks);

// ======================
// Task Input Events
// ======================
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// ======================
// Edit Task Modal
// ======================
closeEditModal.addEventListener('click', () => {
  editTaskModal.style.display = 'none';
});
saveEditBtn.addEventListener('click', saveEditTask);

// ======================
// Keyboard Shortcuts
// ======================
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    taskInput.focus();
  }
});

// ======================
// Toast Notification
// ======================
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ======================
// Save Data
// ======================
function saveData() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// ======================
// Initialization
// ======================
updateCategoryDropdowns();
renderTasks();

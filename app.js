const app = document.getElementById('app');

// Хранение данных
const USERS_KEY = 'taskmanager_users';
const TASKS_KEY = 'taskmanager_tasks';
const AUTH_KEY = 'taskmanager_auth';
const REGISTRATION_DATE_KEY = 'taskmanager_registration_dates';
const THEME_KEY = 'taskmanager_theme'; // Новый ключ для темы

let currentUser = JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
let currentView = localStorage.getItem('taskmanager_view') || 'board';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentSort = localStorage.getItem('taskmanager_sort') || 'none';
let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
let currentTheme = localStorage.getItem(THEME_KEY) || 'light'; // Состояние темы

// Добавляем Font Awesome иконки динамически
document.head.insertAdjacentHTML(
  'beforeend',
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">'
);

// Загрузка данных
function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Загрузка дат регистрации
function loadRegistrationDates() {
  return JSON.parse(localStorage.getItem(REGISTRATION_DATE_KEY)) || {};
}

// Сохранение дат регистрации
function saveRegistrationDates(dates) {
  localStorage.setItem(REGISTRATION_DATE_KEY, JSON.stringify(dates));
}


function loadTasks() {
  if (!currentUser) return [];
  const allTasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || {};
  let tasks = allTasks[currentUser.email] || []; // Use email as key for tasks

  // Apply sorting
  if (currentSort !== 'none') {
    tasks = sortTasks(tasks, currentSort);
  }

  return tasks;
}

function saveTasks(tasks) {
  if (!currentUser) return;
  const allTasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || {};
  allTasks[currentUser.email] = tasks; // Use email as key for tasks
  localStorage.setItem(TASKS_KEY, JSON.stringify(allTasks));
}

// Sorting function
function sortTasks(tasks, sortBy) {
  return tasks.sort((a, b) => {
    if (sortBy === 'priority-asc') {
      const priorityOrder = {'Низкий': 1, 'Средний': 2, 'Высокий': 3};
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'priority-desc') {
      const priorityOrder = {'Низкий': 1, 'Средний': 2, 'Высокий': 3};
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === 'deadline-asc') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortBy === 'deadline-desc') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(b.deadline) - new Date(a.deadline);
    } else if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'title-desc') {
      return b.title.localeCompare(a.title);
    }
    return 0; // Default to no sorting
  });
}


// Роутер
function router() {
  const hash = window.location.hash || '#login';

  if (!currentUser && !['#login', '#register', '#forgot-password'].includes(hash)) {
    window.location.hash = '#login';
    return;
  }

  // Перенаправляем авторизованного пользователя с #login или #register на #tasks
   if (currentUser && (hash === '#login' || hash === '#register')) {
       window.location.hash = '#tasks';
       return;
   }


  switch (hash) {
    case '#login':
      renderLogin();
      break;
    case '#register':
      renderRegister();
      break;
    case '#forgot-password': // Placeholder for future implementation
      renderForgotPassword();
      break;
    case '#tasks':
      renderTasks();
      break;
    case '#task-new':
      renderTaskForm();
      break;
    case '#profile': // New route for user profile
      renderProfile();
      break;
    default:
      if (hash.startsWith('#task-edit-')) {
        const id = hash.split('-')[2];
        renderTaskForm(id);
      } else {
        renderNotFound();
      }
  }
}

// Рендеринг страниц
function renderAppLayout(content) {
  // Добавляем или убираем класс в зависимости от состояния авторизации
  if (currentUser) {
       app.classList.remove('logged-out');
       app.classList.add('logged-in');
   } else {
       app.classList.remove('logged-in');
       app.classList.add('logged-out');
   }

   // Применяем сохраненную тему при рендеринге макета
   applyTheme(currentTheme);


  if (!currentUser) {
    app.innerHTML = content;
    return;
  }

  // Добавляем класс для свернутого сайдбара, если он был сохранен
  if (sidebarCollapsed) {
      app.classList.add('sidebar-collapsed');
  } else {
      app.classList.remove('sidebar-collapsed');
  }


  app.innerHTML = `
    <aside class="sidebar">
      <button class="sidebar-toggle" id="sidebar-toggle">
        <i class="fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}"></i>
      </button>
      <div class="sidebar-section">
        <h3 class="sidebar-title">Меню</h3>
        <a href="#tasks" class="sidebar-link ${window.location.hash === '#tasks' ? 'active' : ''}">
          <i class="fas fa-tasks"></i>
          <span>Задачи</span>
        </a>
         <a href="#profile" class="sidebar-link ${window.location.hash === '#profile' ? 'active' : ''}">
           <i class="fas fa-user"></i>
           <span>Профиль</span>
         </a>
      </div>

      <div class="sidebar-section">
        <h3 class="sidebar-title">Представления</h3>
        <a href="#tasks" class="sidebar-link ${currentView === 'board' ? 'active' : ''}" onclick="setView('board')">
          <i class="fas fa-table-cells"></i>
          <span>Доска</span>
        </a>
        <a href="#tasks" class="sidebar-link ${currentView === 'list' ? 'active' : ''}" onclick="setView('list')">
          <i class="fas fa-list"></i>
          <span>Список</span>
        </a>
        <a href="#tasks" class="sidebar-link ${currentView === 'calendar' ? 'active' : ''}" onclick="setView('calendar')">
          <i class="fas fa-calendar"></i>
          <span>Календарь</span>
        </a>
      </div>

      <div class="sidebar-section">
        <h3 class="sidebar-title">Настройки</h3>
         <a href="#" class="sidebar-link" id="theme-toggle-link">
           <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
           <span id="theme-toggle-text">${currentTheme === 'dark' ? 'Светлая тема' : 'Темная тема'}</span>
         </a>
        <a href="#" class="sidebar-link" id="logout-link">
          <i class="fas fa-sign-out-alt"></i>
          <span>Выйти</span>
        </a>
      </div>
    </aside>

    <header class="header">
      <h1 class="header-title">Task Manager</h1>
       ${window.location.hash === '#tasks' ? `
         <div class="header-actions">
           <button class="btn btn-primary" onclick="window.location.hash = '#task-new'">
             <i class="fas fa-plus"></i> Новая задача
           </button>
         </div>
       ` : ''}
    </header>

    <main class="main-content">
      ${content}
    </main>
  `;

  // Добавьте обработчики событий ПОСЛЕ того, как элементы добавлены в DOM
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
      sidebarToggle.onclick = toggleSidebar;
  }

  const themeToggleLink = document.getElementById('theme-toggle-link');
  if (themeToggleLink) {
      themeToggleLink.onclick = e => {
        e.preventDefault();
        toggleTheme(); // Переключаем тему при клике
      };
  }


  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
      logoutLink.onclick = e => {
        e.preventDefault();
        if (confirm('Вы уверены, что хотите выйти?')) {
          currentUser = null;
          localStorage.removeItem(AUTH_KEY);
          window.location.hash = '#login';
          // Сбрасываем состояние сайдбара при выходе
          sidebarCollapsed = false;
          localStorage.setItem('sidebarCollapsed', 'false');
        }
      };
  }
}

// Функция для переключения состояния сайдбара
function toggleSidebar() {
  const app = document.getElementById('app');
  const toggleButtonIcon = document.getElementById('sidebar-toggle').querySelector('i');

  // Переключаем класс
  const isCollapsed = app.classList.toggle('sidebar-collapsed');

  // Обновляем состояние в переменной и localStorage
  sidebarCollapsed = isCollapsed;
  localStorage.setItem('sidebarCollapsed', isCollapsed);

  // Меняем иконку кнопки с анимацией
  toggleButtonIcon.classList.remove('fas', 'fa-chevron-left', 'fa-chevron-right'); // Убираем текущие классы
  if (isCollapsed) {
    toggleButtonIcon.classList.add('fas', 'fa-chevron-right');
  } else {
    toggleButtonIcon.classList.add('fas', 'fa-chevron-left');
  }
}

// Функция для применения темы (добавляет класс к body)
function applyTheme(theme) {
    const body = document.body;
    if (theme === 'dark') {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
}

// Функция для переключения темы
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light'; // Переключаем состояние
    localStorage.setItem(THEME_KEY, currentTheme); // Сохраняем в localStorage
    applyTheme(currentTheme); // Применяем новую тему к body

    // Обновляем текст и иконку ссылки в сайдбаре, если она существует
    const themeToggleIcon = document.getElementById('theme-toggle-link')?.querySelector('i');
    const themeToggleText = document.getElementById('theme-toggle-text');

    if (themeToggleIcon) {
        themeToggleIcon.classList.remove('fas', 'fa-sun', 'fa-moon');
        themeToggleIcon.classList.add('fas', `fa-${currentTheme === 'dark' ? 'sun' : 'moon'}`);
    }
     if (themeToggleText) {
         themeToggleText.textContent = currentTheme === 'dark' ? 'Светлая тема' : 'Темная тема';
     }
}


function renderLogin() {
  renderAppLayout(`
    <div class="auth-form animate__animated animate__fadeIn">
      <h2>Авторизация</h2>
      <form id="login-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input type="email" id="login-email" required />
        </div>
        <div class="form-group">
          <label for="login-password">Пароль</label>
          <input type="password" id="login-password" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Войти</button>
          <a href="#register">Регистрация</a>
        </div>
      </form>
    </div>
  `);

  document.getElementById('login-form').onsubmit = e => {
    e.preventDefault();
    const email = e.target['login-email'].value.trim();
    const password = e.target['login-password'].value;

    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      currentUser = user;
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
      window.location.hash = '#tasks';
    } else {
      alert('Неверный email или пароль');
    }
  };
}

function renderRegister() {
  renderAppLayout(`
    <div class="auth-form animate__animated animate__fadeIn">
      <h2>Регистрация</h2>
      <form id="register-form">
        <div class="form-group">
          <label for="register-username">Имя пользователя</label>
          <input type="text" id="register-username" required />
        </div>
        <div class="form-group">
          <label for="register-email">Email</label>
          <input type="email" id="register-email" required />
        </div>
        <div class="form-group">
          <label for="register-password">Пароль</label>
          <input type="password" id="register-password" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
          <a href="#login">Войти</a>
        </div>
      </form>
    </div>
  `);

  document.getElementById('register-form').onsubmit = e => {
    e.preventDefault();
    const username = e.target['register-username'].value.trim();
    const email = e.target['register-email'].value.trim();
    const password = e.target['register-password'].value;

    const users = loadUsers();
    if (users.find(u => u.email === email)) {
      alert('Пользователь с таким email уже существует');
      return;
    }

    const registrationDates = loadRegistrationDates();
    const newUser = { username, email, password };
    users.push(newUser);
    registrationDates[email] = new Date().toISOString().split('T')[0]; // Store registration date by email

    saveUsers(users);
    saveRegistrationDates(registrationDates);

    alert('Регистрация успешна! Теперь вы можете войти.');
    window.location.hash = '#login';
  };
}

function renderForgotPassword() {
     renderAppLayout(`
    <div class="auth-form animate__animated animate__fadeIn">
      <h2>Восстановление пароля</h2>
      <p>Эта функция пока не реализована.</p>
       <div class="form-actions" style="justify-content: center;">
         <a href="#login" class="btn btn-primary">Вернуться ко входу</a>
       </div>
    </div>
  `);
}


function renderTasks() {
  const tasks = loadTasks();

  let content = '';

  const sortControlsHtml = `
    <div class="sort-controls">
      <label for="sort-by">Сортировать по:</label>
      <select id="sort-by" onchange="setSort(this.value)">
        <option value="none" ${currentSort === 'none' ? 'selected' : ''}>Без сортировки</option>
        <option value="priority-asc" ${currentSort === 'priority-asc' ? 'selected' : ''}>Приоритету (возрастание)</option>
        <option value="priority-desc" ${currentSort === 'priority-desc' ? 'selected' : ''}>Приоритету (убывание)</option>
        <option value="deadline-asc" ${currentSort === 'deadline-asc' ? 'selected' : ''}>Дедлайну (по возрастанию)</option>
        <option value="deadline-desc" ${currentSort === 'deadline-desc' ? 'selected' : ''}>Дедлайну (по убыванию)</option>
         <option value="title-asc" ${currentSort === 'title-asc' ? 'selected' : ''}>Названию (А-Я)</option>
        <option value="title-desc" ${currentSort === 'title-desc' ? 'selected' : ''}>Названию (Я-А)</option>
      </select>
    </div>
  `;


  if (currentView === 'board') {
    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    content = `
      <div class="animate__animated animate__fadeIn">
        ${sortControlsHtml}
        <div class="board">
          <div class="board-column">
            <h3 class="column-title">Новые</h3>
            ${pendingTasks.length > 0 ? pendingTasks.map(task => renderTaskCard(task)).join('') : '<p style="text-align: center; color: var(--text-light);">Задач нет</p>'}
          </div>
          <div class="board-column">
            <h3 class="column-title">Выполненные</h3>
            ${completedTasks.length > 0 ? completedTasks.map(task => renderTaskCard(task)).join('') : '<p style="text-align: center; color: var(--text-light);">Нет выполненных задач</p>'}
          </div>
        </div>
      </div>
    `;
  } else if (currentView === 'list') {
    content = `
      <div class="animate__animated animate__fadeIn">
        ${sortControlsHtml}
        <div class="list-view">
          ${tasks.length > 0 ? `
            <div class="list-header">
              <div>Задача</div>
              <div>Приоритет</div>
              <div>Срок</div>
              <div>Действия</div>
            </div>
            ${tasks.map(task => `
              <div class="list-item">
                <div class="list-item-title">${escapeHtml(task.title)}</div>
                <div>
                  <span class="task-priority priority-${getPriorityClass(task.priority)}">
                    ${escapeHtml(task.priority)}
                  </span>
                </div>
                <div>${task.deadline ? formatDate(task.deadline) : '-'}</div>
                <div class="list-item-actions">
                  <button class="task-btn" onclick="toggleTaskStatus(${task.id})">
                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                  </button>
                  <button class="task-btn" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="task-btn" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          ` : '<p style="text-align: center; padding: 20px; color: var(--text-light);">Нет задач в списке.</p>'}
        </div>
      </div>
    `;
  } else if (currentView === 'calendar') {
    content = `<div class="animate__animated animate__fadeIn">${renderCalendar()}</div>`;
  }

  renderAppLayout(content);
}

// Function to render user profile (unchanged from previous step)
function renderProfile() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    const registrationDates = loadRegistrationDates();
    const registrationDate = registrationDates[currentUser.email] ? formatDate(registrationDates[currentUser.email]) : 'Неизвестно';

    const content = `
        <div class="auth-form animate__animated animate__fadeIn">
            <h2>Профиль пользователя</h2>
            <div>
                <p><strong>Имя пользователя:</strong> ${escapeHtml(currentUser.username)}</p>
                <p><strong>Email:</strong> ${escapeHtml(currentUser.email)}</p>
                <p><strong>Дата регистрации:</strong> ${registrationDate}</p>
            </div>
            <div class="form-group" style="margin-top: 20px;">
                <label for="current-password">Текущий пароль</label>
                <input type="password" id="current-password" />
            </div>
             <div class="form-group">
                <label for="new-password">Новый пароль</label>
                <input type="password" id="new-password" />
            </div>
            <div class="form-group">
                <label for="confirm-new-password">Подтвердите новый пароль</label>
                <input type="password" id="confirm-new-password" />
            </div>
            <div class="form-actions" style="justify-content: flex-start;">
                 <button class="btn btn-primary" id="change-password-btn">Сменить пароль</button>
            </div>
        </div>
    `;

    renderAppLayout(content);

    document.getElementById('change-password-btn').onclick = () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            alert('Пожалуйста, заполните все поля для смены пароля.');
            return;
        }

        if (currentPassword !== currentUser.password) {
            alert('Неверный текущий пароль.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('Новый пароль и подтверждение не совпадают.');
            return;
        }

        if (newPassword === currentPassword) {
             alert('Новый пароль совпадает с текущим.');
             return;
        }


        const users = loadUsers();
        const userIndex = users.findIndex(u => u.email === currentUser.email);

        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            saveUsers(users);
            currentUser.password = newPassword; // Update current user object
            localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser)); // Update local storage
            alert('Пароль успешно изменен!');
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        } else {
            alert('Произошла ошибка при смене пароля.');
        }
    };
}


// Functions for Calendar, Task Card, Task Form, Not Found, Helpers, Global Functions (unchanged)
function renderCalendar() {
  const tasks = loadTasks();
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Получаем первый и последний день месяца
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Получаем день недели первого дня месяца (0 - воскресенье, 1 - понедельник и т.д.)
  const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  // Получаем количество дней в месяце
  const daysInMonth = lastDay.getDate();

  // Создаем массив дней для календаря
  const days = [];

  // Добавляем пустые ячейки для дней предыдущего месяца
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ empty: true });
  }

  // Добавляем дни текущего месяца
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => task.deadline === dateStr);

    days.push({
      date: i,
      dateStr,
      isToday: date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear(),
      tasks: dayTasks
    });
  }

  return `
    <div class="calendar-view">
      <div class="calendar-header">
        <h2 class="calendar-title">${monthNames[currentMonth]} ${currentYear}</h2>
        <div class="calendar-nav">
          <button class="btn btn-outline" onclick="changeCalendarMonth(-1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="btn btn-outline" onclick="resetCalendar()">
            Сегодня
          </button>
          <button class="btn btn-outline" onclick="changeCalendarMonth(1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="calendar-grid">
        ${dayNames.map(day => `
          <div class="calendar-day-header">${day}</div>
        `).join('')}

        ${days.map(day => day.empty ? `
          <div class="calendar-day empty"></div>
        ` : `
          <div class="calendar-day ${day.isToday ? 'today' : ''}">
            <div class="calendar-date">${day.date}</div>
            <div class="calendar-tasks">
              ${day.tasks.map(task => `
                <div class="calendar-task ${getPriorityClass(task.priority)}"
                     onclick="editTask(${task.id})">
                  ${escapeHtml(task.title)}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTaskCard(task) {
  return `
    <div class="task-card" draggable="true" data-id="${task.id}">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-meta">
        <span class="task-priority priority-${getPriorityClass(task.priority)}">
          ${escapeHtml(task.priority)}
        </span>
        ${task.deadline ? `<span>${formatDate(task.deadline)}</span>` : ''}
      </div>
      <div class="task-actions">
        <button class="task-btn" onclick="toggleTaskStatus(${task.id})">
          <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
        </button>
        <button class="task-btn" onclick="editTask(${task.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="task-btn" onclick="deleteTask(${task.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function renderTaskForm(taskId = null) {
  const tasks = loadTasks();
  const task = taskId ? tasks.find(t => t.id === Number(taskId)) : null;

  renderAppLayout(`
    <div class="auth-form animate__animated animate__fadeIn">
      <h2>${task ? 'Редактировать задачу' : 'Создать задачу'}</h2>
      <form id="task-form">
        <div class="form-group">
          <label for="task-title">Название задачи *</label>
          <input type="text" id="task-title" required value="${task ? escapeHtml(task.title) : ''}" />
        </div>
        <div class="form-group">
          <label for="task-desc">Описание</label>
          <textarea id="task-desc">${task ? escapeHtml(task.description) : ''}</textarea>
        </div>
        <div class="form-group">
          <label for="task-priority">Приоритет</label>
          <select id="task-priority">
            <option value="Низкий" ${task && task.priority === 'Низкий' ? 'selected' : ''}>Низкий</option>
            <option value="Средний" ${task && task.priority === 'Средний' ? 'selected' : ''}>Средний</option>
            <option value="Высокий" ${task && task.priority === 'Высокий' ? 'selected' : ''}>Высокий</option>
          </select>
        </div>
        <div class="form-group">
          <label for="task-deadline">Дедлайн</label>
          <input type="date" id="task-deadline" value="${task ? task.deadline : ''}" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${task ? 'Сохранить' : 'Создать'}</button>
          <a href="#tasks">Отмена</a>
        </div>
      </form>
    </div>
  `);

  document.getElementById('task-form').onsubmit = e => {
    e.preventDefault();
    const title = e.target['task-title'].value.trim();
    const description = e.target['task-desc'].value.trim();
    const priority = e.target['task-priority'].value;
    const deadline = e.target['task-deadline'].value;

    if (!title) {
      alert('Название задачи обязательно');
      return;
    }

    if (task) {
      // Редактирование
      task.title = title;
      task.description = description;
      task.priority = priority;
      task.deadline = deadline;
    } else {
      // Создание новой
      tasks.push({
        id: Date.now(),
        title,
        description,
        priority,
        deadline,
        completed: false,
      });
    }

    saveTasks(tasks);
    window.location.hash = '#tasks';
  };
}

function renderNotFound() {
  renderAppLayout(`
    <div class="auth-form animate__animated animate__fadeIn">
      <h2>404 - Страница не найдена</h2>
      <p>Такой страницы не существует.</p>
      <a href="#tasks" class="btn btn-primary">Вернуться к задачам</a>
    </div>
  `);
}

// Вспомогательные функции
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getPriorityClass(priority) {
  switch (priority) {
    case 'Высокий': return 'high';
    case 'Средний': return 'medium';
    case 'Низкий': return 'low';
    default: return '';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
   const year = date.getFullYear();
   const month = (date.getMonth() + 1).toString().padStart(2, '0');
   const day = date.getDate().toString().padStart(2, '0');
   return `${day}.${month}.${year}`;
}


// Глобальные функции для кнопок
window.setView = function(view) {
  currentView = view;
  localStorage.setItem('taskmanager_view', view);
  if (window.location.hash === '#tasks') {
    renderTasks();
  }
};

window.changeCalendarMonth = function(offset) {
  currentMonth += offset;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderTasks();
};

window.resetCalendar = function() {
  const today = new Date();
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  renderTasks();
};

window.toggleTaskStatus = function(id) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks(tasks);
    renderTasks();
  }
};

window.editTask = function(id) {
  window.location.hash = `#task-edit-${id}`;
};

window.deleteTask = function(id) {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    const tasks = loadTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
      saveTasks(tasks);
      renderTasks();
    }
  }
};

window.setSort = function(sortBy) {
  currentSort = sortBy;
  localStorage.setItem('taskmanager_sort', sortBy);
  renderTasks(); // Re-render tasks with new sorting
};

// Добавляем функцию toggleSidebar в глобальную область видимости
window.toggleSidebar = toggleSidebar;

// Добавляем функцию toggleTheme в глобальную область видимости
window.toggleTheme = toggleTheme;


// Инициализация
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    // При загрузке проверяем состояние сайдбара из localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
        sidebarCollapsed = savedState === 'true';
    }
    // Применяем сохраненную тему при загрузке страницы
    applyTheme(currentTheme);
    router();
});
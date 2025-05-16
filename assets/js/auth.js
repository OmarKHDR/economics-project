// Authentication functionality

// Initialize local storage for users if not exists
function initUserStorage() {
  if (!localStorage.getItem('users')) {
    // Create default admin user
    const defaultUsers = [
      {
        id: 1,
        name: 'Service Provider',
        email: 'service@example.com',
        password: 'service123',
        role: 'service_provider',
        profilePic: null
      },
      {
        id: 2,
        name: 'Home User',
        email: 'user@example.com',
        password: 'user123',
        role: 'home_user',
        profilePic: null
      }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
}

// Get users from localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Register new user
function registerUser(userData) {
  const users = getUsers();
  
  // Check if email already exists
  if (users.some(user => user.email === userData.email)) {
    throw new Error('Email already registered');
  }
  
  // Add new user
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    ...userData
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Login user
function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Store current user in session storage (cleared when browser closes)
  const userSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic
  };
  
  sessionStorage.setItem('currentUser', JSON.stringify(userSession));
  return userSession;
}

// Get current logged in user
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('currentUser'));
}

// Logout user
function logoutUser() {
  sessionStorage.removeItem('currentUser');
  window.location.href = '../index.html';
}

// Check if user is logged in
function isLoggedIn() {
  return !!getCurrentUser();
}

// Redirect if not logged in
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/index.html';
  }
}

// Redirect based on role
function redirectBasedOnRole() {
  const user = getCurrentUser();
  if (!user) return;
  
  switch(user.role) {
    case 'service_provider':
      window.location.href = '/load-management/index.html';
      break;
    case 'home_user':
      window.location.href = '/smart-home/index.html';
      break;
    default:
      // Default to dashboard
      window.location.href = '/dashboard.html';
  }
}

// Handle theme toggle
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  // Check if theme preference is stored
  const darkMode = localStorage.getItem('darkMode') === 'true';
  
  // Apply theme
  document.body.classList.toggle('dark-mode', darkMode);
  if (themeToggle) {
    themeToggle.checked = darkMode;
  }
  
  // Add toggle event listener
  themeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
    localStorage.setItem('darkMode', this.checked);
  });
}

// Update header with user info
function updateUserHeader() {
  const userInfoElement = document.getElementById('user-info');
  if (!userInfoElement) return;
  
  const user = getCurrentUser();
  if (user) {
    let profilePicHtml = user.profilePic 
      ? `<img src="${user.profilePic}" alt="${user.name}" class="avatar">` 
      : `<div class="avatar"><i class="fas fa-user"></i></div>`;
      
    userInfoElement.innerHTML = `
      <div class="user-info">
        ${profilePicHtml}
        <div>
          <div class="user-name">${user.name}</div>
          <div class="user-role">${user.role === 'service_provider' ? 'Service Provider' : 'Home User'}</div>
        </div>
      </div>
      <button id="logout-btn" class="btn btn-danger">Logout</button>
    `;
    
    // Add logout event listener
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
  }
}

// Initialize auth functionality
function initAuth() {
  initUserStorage();
  initThemeToggle();
  
  // Update user header if on authenticated page
  if (document.getElementById('user-info')) {
    requireAuth();
    updateUserHeader();
  }
}

// Document ready function
document.addEventListener('DOMContentLoaded', initAuth);
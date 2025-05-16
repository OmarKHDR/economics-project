/**
 * Route Protection Script
 * Enforces role-based access to different sections of the application
 */

import { getUserSession, redirectBasedOnRole } from './auth.js';

/**
 * Protects routes based on user role
 * @param {string} allowedRole - The role allowed to access this route
 */
function protectRoute(allowedRole) {
  const user = getUserSession();
  
  // If no user is logged in, redirect to login page
  if (!user) {
    window.location.href = '/index.html';
    return;
  }
  
  // If user doesn't have the required role, redirect based on their role
  if (user.role !== allowedRole) {
    redirectBasedOnRole();
    return;
  }
}

/**
 * Initializes route protection for service provider routes
 */
function protectServiceProviderRoute() {
  protectRoute('service_provider');
}

/**
 * Initializes route protection for home user routes
 */
function protectHomeUserRoute() {
  protectRoute('home_user');
}

/**
 * Initializes route protection for general authenticated routes
 * Allows access to any authenticated user
 */
function protectAuthenticatedRoute() {
  const user = getUserSession();
  
  // If no user is logged in, redirect to login page
  if (!user) {
    window.location.href = '/index.html';
  }
}

export {
  protectServiceProviderRoute,
  protectHomeUserRoute,
  protectAuthenticatedRoute
}; 
// Initialize Firebase with CDN imports for browser compatibility
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, ref, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { sha256 } from './utils.js';

// Firebase configuration
const firebaseConfig = ;
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Session management
const USER_SESSION_KEY = 'user_session';

// User authentication functions
async function registerUser(userData) {
  try {
    // Check if user already exists
    const userQuery = query(collection(db, "users"), where("email", "==", userData.email));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      throw new Error("User with this email already exists");
    }

    // Hash the password for security
    const passwordHash = await sha256(userData.password);
    
    // Create user document
    const userDoc = {
      name: userData.name,
      email: userData.email,
      passwordHash: passwordHash,
      pictureBase64: userData.profilePic || null,
      role: userData.role,
      createdAt: new Date()
    };
    
    // Add user to Firestore
    const docRef = await addDoc(collection(db, "users"), userDoc);
    
    // Set session with user data (excluding password)
    const sessionUser = {
      id: docRef.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      profilePic: userData.profilePic
    };
    
    setUserSession(sessionUser);
    
    // Redirect based on role
    redirectBasedOnRole();
    
    return sessionUser;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

async function loginUser(email, password) {
  try {
    // Hash the password to compare
    const passwordHash = await sha256(password);
    
    // Query user by email
    const userQuery = query(collection(db, "users"), where("email", "==", email));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      throw new Error("User not found");
    }
    
    // Get the first matching user
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Verify password
    if (userData.passwordHash !== passwordHash) {
      throw new Error("Invalid password");
    }
    
    // Set session with user data
    const sessionUser = {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      profilePic: userData.pictureBase64
    };
    
    setUserSession(sessionUser);
    
    // Redirect based on role
    redirectBasedOnRole();
    
    return sessionUser;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

function redirectBasedOnRole() {
  const user = getUserSession();
  
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  
  if (user.role === "service_provider") {
    window.location.href = "/load-management/index.html";
  } else if (user.role === "home_user") {
    window.location.href = "/smart-home/index.html";
  } else {
    window.location.href = "/dashboard.html";
  }
}

function isLoggedIn() {
  return getUserSession() !== null;
}

function getUserSession() {
  const sessionData = localStorage.getItem(USER_SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

function setUserSession(userData) {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
}

function clearUserSession() {
  localStorage.removeItem(USER_SESSION_KEY);
}

function logoutUser() {
  clearUserSession();
  window.location.href = "/index.html";
}

export {
  registerUser,
  loginUser,
  redirectBasedOnRole,
  isLoggedIn,
  getUserSession,
  logoutUser
}; 
# Economics Project

This project is a web-based application designed to facilitate economic data analysis and visualization. It leverages modern web technologies and integrates with Firebase for backend services.

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Setup Instructions](#setup-instructions)
* [Deployment](#deployment)

## Features

* **Interactive Frontend**: Built with modern JavaScript frameworks to provide a responsive user interface.
* **Firebase Integration**: Utilizes Firebase for authentication, database management, and hosting.
* **Real-time Data Handling**: Implements Firestore for real-time data synchronization.
* **Secure Authentication**: Employs Firebase Authentication for user management.

## Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js with Express.js
* **Database**: Firebase Firestore
* **Authentication**: Firebase Authentication
* **Hosting**: Firebase Hosting([GitHub Docs][1], [leap.unibocconi.eu][2])

## Project Structure

```
economics-project/
├── .vscode/                  # VSCode configuration files
├── frontend/                 # Frontend source code
├── .firebaserc               # Firebase project configuration
├── firebase.config.template.js  # Template for Firebase config
├── firebase.json             # Firebase hosting configuration
├── firestore.indexes.json    # Firestore indexes configuration
├── firestore.rules           # Firestore security rules
├── package.json              # Node.js project metadata and dependencies
├── package-lock.json         # Exact versions of installed dependencies
├── server.js                 # Express.js server setup
```



## Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/OmarKHDR/economics-project.git
   cd economics-project
   ```



2. **Install Dependencies**:

   ```bash
   npm install
   ```



3. **Configure Firebase**:

   * Copy `firebase.config.template.js` to `firebase.config.js`.
   * Fill in your Firebase project credentials in `firebase.config.js`.([GitHub][3])

4. **Start the Server**:

   ```bash
   node server.js
   ```



The application should now be running at `http://localhost:3000/`.

## Deployment

To deploy the application using Firebase Hosting:

1. **Install Firebase CLI**:

   ```bash
   npm install -g firebase-tools
   ```



2. **Login to Firebase**:

   ```bash
   firebase login
   ```



3. **Initialize Firebase in the Project**:

   ```bash
   firebase init
   ```



Follow the prompts to set up hosting and other Firebase features as needed.

4. **Deploy to Firebase**:

   ```bash
   firebase deploy
   ```



Your application will be live at the Firebase-provided URL.

---

*Note: For detailed information on setting up and managing Firebase projects, refer to the [Firebase Documentation](https://firebase.google.com/docs).*

[1]: https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories?utm_source=chatgpt.com "Quickstart for repositories - GitHub Docs"
[2]: https://leap.unibocconi.eu/resources/courses/git-for-research-in-economics?utm_source=chatgpt.com "Git for Research in Economics - Leap"
[3]: https://github.com/Alalalalaki/Guide2EconRA?utm_source=chatgpt.com "Alalalalaki/Guide2EconRA - GitHub"

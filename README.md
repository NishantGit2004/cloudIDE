# 🧠 CloudIDE - A Browser-Based Development Environment

CloudIDE is a full-stack web application that provides a powerful, browser-based Integrated Development Environment (IDE). It allows users to create projects, write code in multiple languages, and execute it within a secure, containerized terminal, all from the comfort of their web browser.

This project is built to solve the "it works on my machine" problem by providing a consistent and isolated development environment for every project, powered by Docker.

## Key Features

* **Project Dashboard**: A user-friendly dashboard to create, view, and manage all your development projects.
* **Real-time Code Editor**: An in-browser code editor based on **Ace Editor**, featuring syntax highlighting, auto-completion, and multiple themes.
* **Integrated Terminal**: A fully functional terminal running in a secure Docker container, giving you shell access to your project's environment.
* **Dynamic File Explorer**: A collapsible file tree to easily navigate your project's directory structure.
* **Secure User Authentication**: A complete user registration and login system using JWT (JSON Web Tokens) for secure access.
* **Containerized Environments**: Each project runs in its own isolated **Docker container**, ensuring security and dependency management without conflicts.
* **Real-time File Syncing**: File changes are automatically detected and synced, reflecting in the file explorer in real-time.

## Tech Stack

This project is built with a modern, full-stack JavaScript architecture.

| Component      | Technologies                                                                          |
| :------------- | :------------------------------------------------------------------------------------ |
| **Frontend** | React, React Router, Socket.io-client, Axios, Ace Editor, Xterm.js, Vite               |
| **Backend** | Node.js, Express, Socket.io, MongoDB (with Mongoose)                                  |
| **Authentication**| JWT (Access & Refresh Tokens), bcryptjs, cookie-parser                                |
| **Architecture** | **Docker**, `node-pty` for pseudo-terminal access, `chokidar` for file watching       |
| **Database** | MongoDB                                                                               |

## System Architecture Diagram

![CloudIDE System Architecture](https://github.com/NishantGit2004/cloudIDE/blob/main/SystemArchitecture.png?raw=true)

## Architecture Deep Dive: Docker at the Core

The most critical architectural feature of CloudIDE is its use of Docker to create secure and isolated development environments.

1.  **Project Creation**: When a user creates a new project, the server creates a corresponding project entry in the MongoDB database.
2.  **Container Provisioning**: The server then uses the `docker/containerManager.js` module to programmatically spin up a dedicated Docker container for that project.
3.  **Custom Docker Image**: Each container is created from a custom Docker image (defined in `server/dockerfile`) that comes pre-installed with essential runtimes like **Node.js, Python, Java, Go, GCC,** and more.
4.  **Volume Mounting**: The project's directory on the host machine is mounted as a volume into the container's `/workspace` directory. This allows the user's code to persist even if the container is stopped.
5.  **Secure Terminal Access**: The backend uses the `node-pty` library to create a pseudo-terminal process that attaches directly to the running Docker container's `bash` shell. This process is then connected to the frontend via a **Socket.io** WebSocket, streaming terminal input and output securely and in real time.

This approach ensures that user code execution is completely sandboxed, preventing any potential security risks to the host server and ensuring that each project has a clean, consistent environment.

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm
* Docker Desktop installed and running
* MongoDB instance (local or on Atlas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/NishantGit2004/cloudIDE.git](https://github.com/NishantGit2004/cloudIDE.git)
    cd cloudIDE
    ```

2.  **Build the Custom Docker Image:**
    Navigate to the server directory and build the image that will be used for the development environments.
    ```bash
    cd server
    docker build -t my-ide-node22 .
    ```

3.  **Configure the Server:**
    * Create a `.env` file in the `server` directory.
    * Add the following environment variables. Be sure to generate your own secure secrets.
        ```env
        PORT=9000
        MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net
        CORS_ORIGIN=http://localhost:5173
        
        ACCESS_TOKEN_SECRET=your_super_secret_access_token
        ACCESS_TOKEN_EXPIRY=1d
        REFRESH_TOKEN_SECRET=your_super_secret_refresh_token
        REFRESH_TOKEN_EXPIRY=10d
        ```
    * Install server dependencies and start the server:
        ```bash
        npm install
        npm start
        ```

4.  **Configure and Run the Client:**
    * Open a new terminal and navigate to the `client` directory.
    * Install client dependencies and start the development server:
        ```bash
        cd ../client
        npm install
        npm run dev
        ```

5.  **Access the Application:**
    Open your browser and navigate to `http://localhost:5173`. You should now be able to register a new user and start creating projects!

## Usage

1.  **Register an Account**: Create a new user account on the registration page.
2.  **Login**: Log in with your new credentials.
3.  **Create a Project**: From the dashboard, enter a project name and click "Create Project". This will provision a new Docker container for you in the background.
4.  **Open the IDE**: Click "Open" on your newly created project to enter the IDE view.
5.  **Code!**: Create new files, write code, and use the integrated terminal to run commands, install packages, and execute your code inside the secure container.

## Future Improvements

* **Real-time Collaborative Editing**: Implement CRDTs or OT to allow multiple users to edit the same file simultaneously.
* **Git Integration**: Add features to clone from, commit to, and push to GitHub repositories directly from the IDE.
* **Customizable Docker Environments**: Allow users to define their own `Dockerfile` for more customized project environments.
* **Persistent Terminal Sessions**: Save terminal history and state across sessions.

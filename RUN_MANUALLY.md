# How to Run ARSS Manually

This guide explains how to start and run the AI Resume Screening System (ARSS) components manually from your terminal.

---

## Prerequisites

1. **MongoDB**: Make sure MongoDB is running on your system.
   * On Windows (via Administrator Command Prompt/PowerShell):
     ```powershell
     net start MongoDB
     ```

---

## Running the Application

To run the full stack, you need to open **two terminal windows** (one for the backend server and one for the frontend client).

### Terminal 1: Start the Backend Server
Navigate to the `server/` directory, install packages if you haven't, and start the development server:

```powershell
# Navigate to the server folder
cd server

# Start the Node.js backend (runs on port 5001)
npm run dev
```

> **Note**: When the backend server boots, it automatically spawns the persistent Python AI pipeline server in the background (on port `5002`) using the local `.venv` environment. You do **not** need to start Python manually for the web application.

---

### Terminal 2: Start the Frontend Client
Navigate to the `client/` directory, install packages if you haven't, and start the Vite dev server:

```powershell
# Navigate to the client folder
cd client

# Start the Vite development server (runs on port 5000)
npm run dev
```

Once both servers are running, open your web browser and go to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## Running Python Scripts Manually (CLI / Testing)

If you want to run the python matcher or parser scripts directly from the CLI without using the web app interface:

1. **Activate the Virtual Environment**:
   ```powershell
   # In the root directory of the project
   .venv\Scripts\activate
   ```

2. **Run a Test Case**:
   You can run the end-to-end matching pipeline on sample resumes:
   ```powershell
   python test_cases/test_matcher.py --resume data/resumes/arss_qualified_resume.pdf --jd data/sample_job_description.txt
   ```

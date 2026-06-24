# Deployment Guide: Host ARSS for Free

This guide walks you through deploying the **AI Resume Screening System (ARSS)** as a fully working web application using free cloud services: **MongoDB Atlas** (for database) and **Render** or **Replit** (for running the app container).

---

## 1. Get a Free Cloud Database (MongoDB Atlas)

Since local MongoDB isn't available in remote cloud environments, you need a cloud-hosted MongoDB. MongoDB Atlas offers a free-forever tier (M0 cluster).

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and register a free account.
2. Create a new project and build a database choosing the **M0 (Free)** tier.
3. Under **Security → Network Access**, add a rule to allow access from **0.0.0.0/0** (allow all IP addresses) so that cloud hosts like Render or Replit can connect.
4. Under **Security → Database Access**, create a database user (e.g. `arss_admin`) and note down the password.
5. Click **Connect**, choose **Drivers**, and copy the connection string. It will look like this:
   ```
   mongodb+srv://arss_admin:<db_password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   *(Be sure to replace `<db_password>` with the password you created for the database user!)*

---

## 2. Option A: Deploy to Render (Free Docker Hosting)

Render allows you to deploy applications packaged in a Docker container for free. Because this project requires both **Node.js** and **Python** (for the AI parser), using our [Dockerfile](file:///c:/projectsa/ARSS/Dockerfile) is the cleanest way to run it on Render.

### Steps:
1. Push your project code to a private or public repository on **GitHub** or **GitLab**.
2. Sign up/log in to [Render](https://render.com/).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub/GitLab repository.
5. In the creation page:
   - **Name**: `arss-web-app`
   - **Region**: Select the closest one to you
   - **Language**: Choose **Docker** (Render will automatically detect the `Dockerfile` at the root)
   - **Instance Type**: Select **Free**
6. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` *(Render sets this automatically, but good to add)*
   - `MONGODB_URI` = *(Your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET` = *(Generate a long random string)*
   - `ADMIN_EMAIL` = `aibasedresumescreeningsystem@gmail.com` *(or your custom admin email)*
   - `JWT_EXPIRES_IN` = `7d`
7. Click **Create Web Service**. 
Render will build the Docker container (installing Node, Python, and the spaCy NLP libraries), compile the React frontend, and boot up the server.

Once complete, your web app will be live at the provided `.onrender.com` URL!

---

## 3. Option B: Deploy on Replit Deployments

Replit provides virtual machine deployments directly from your workspace.

### Steps:
1. In your Replit project sidebar, click on the **Deploy** tab.
2. Select **Autoscale VM** or **Reserved VM** (Replit offers some trial credits or low-cost plans).
3. Set the build command to:
   ```bash
   npm run install:all && npm run build:client
   ```
4. Set the run command to:
   ```bash
   npm start
   ```
5. Set your environment variables in the deployment configuration:
   - `MONGODB_URI` = *(Your MongoDB Atlas connection string)*
   - `JWT_SECRET` = *(Your JWT secret key)*
   - `ADMIN_EMAIL` = `aibasedresumescreeningsystem@gmail.com`
   - `NODE_ENV` = `production`
6. Click **Deploy**.

---

## 4. Environment Variables Checklist

Ensure these variables are correctly set on your cloud provider:

| Variable Name | Description | Example |
|---|---|---|
| `MONGODB_URI` | Connection string for MongoDB Atlas | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used to sign session tokens | `a_very_long_secure_random_key_here` |
| `JWT_EXPIRES_IN` | Duration of admin session validity | `7d` |
| `ADMIN_EMAIL` | Email allowed to access the admin portal | `aibasedresumescreeningsystem@gmail.com` |
| `NODE_ENV` | Must be set to `production` to activate compiled client serving | `production` |
| `GMAIL_USER` *(Optional)* | Gmail account for incoming email submission | `your_gmail@gmail.com` |
| `GMAIL_APP_PASSWORD` *(Optional)* | App Password to authorize IMAP/SMTP | `xxxx xxxx xxxx xxxx` |

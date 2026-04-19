# Work Session Dashboard

A dependency-free dashboard inspired by the supplied reference image, focused on managing workday tasks with local browser persistence, optional free cloud sync, and JSON backup/restore.

## Features

- Warm editorial dashboard layout with serif headline type, mono labels, and card structure matching the reference.
- Daily task agenda with a week strip, quick-add flow, expandable task detail editor, notes, and subtasks.
- `Now / Next / Later` focus stack for the current working queue.
- Separate statistics view with four live modules based on your saved task and completion data.
- Three theme modes in the header: `Day`, `Night`, and `Hong Kong`.
- Optional free cross-device sync using Firebase Authentication + Cloud Firestore.
- Local persistence in `localStorage`.
- JSON export and import so the full session can be downloaded and restored later.
- Weather side panel powered by Open-Meteo, with editable location lookup.
- Responsive layout tuned for both full-screen and small-screen use.
- GitHub Pages workflow for publishing the dashboard at a stable URL.

## Run

You can open [index.html](/Users/rasmuskopperudriis/Coding/projects/work_dashboard/index.html) directly in a browser, but a tiny local server is more reliable for live feed requests and is required for Firebase login.

Example:

```bash
cd /Users/rasmuskopperudriis/Coding/projects/work_dashboard
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Free Cloud Sync Setup

This project now includes a built-in cloud sync card in the operator module. The app keeps `localStorage` as a fast offline cache, but when you connect Firebase it also saves your tasks, subtasks, settings, and completion history to Firestore so the same account can load the same dashboard on another device.

Use the free Firebase `Spark` plan unless you expect heavy usage.

### 1. Create the Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/).
2. Click `Create a project`.
3. Give it a name such as `work-dashboard`.
4. You can disable Google Analytics for this project unless you specifically want it.
5. Finish project creation.

### 2. Add a web app to the project

1. Inside the Firebase project, click the `</>` web icon to add a web app.
2. Give the app a nickname such as `work-dashboard-web`.
3. Do not enable Firebase Hosting here unless you want to host on Firebase instead of GitHub Pages.
4. Click `Register app`.
5. Firebase will show you a config object that looks like this:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

6. Copy only the JSON object part into the dashboard cloud sync box.

### 3. Enable email/password login

1. In Firebase, open `Authentication`.
2. Click `Get started` if prompted.
3. Open the `Sign-in method` tab.
4. Enable `Email/Password`.
5. Click `Save`.

### 4. Create the Firestore database

1. In Firebase, open `Firestore Database`.
2. Click `Create database`.
3. Choose `Production mode`.
4. Pick a region close to you. If you mainly use this from Norway, `europe-west` is the practical choice.
5. Finish creation.

### 5. Add Firestore security rules

Open the `Rules` tab in Firestore and replace the rules with this:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboards/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Then click `Publish`.

These rules match the app code exactly: each signed-in user can only read and write their own document in the `dashboards` collection.

### 6. Add your allowed domain

If you use the dashboard from GitHub Pages, you must add your GitHub Pages domain to Firebase Authentication:

1. Open `Authentication`.
2. Open `Settings`.
3. Find `Authorized domains`.
4. Add your domain in this format:

`<your-github-username>.github.io`

If you are testing locally on a small server, `localhost` is usually already allowed.

### 7. Connect the dashboard

1. Run the dashboard on `http://localhost:8080` or open your deployed GitHub Pages URL.
2. In the `Cloud Sync` card, paste the Firebase config JSON.
3. Click `Save config`.
4. The page reloads.
5. Enter your email and password.
6. Click `Sign up` the first time.
7. On later devices, use the same email and password with `Log in`.
8. After login, the app will compare local data and cloud data and keep the newer copy.

### 8. Daily usage

- Every normal task change still saves locally first.
- If you are logged in, the app also syncs the full dashboard to Firestore automatically.
- `Download JSON` and `Upload JSON` still work as a manual backup/restore path.
- `Sync now` forces an immediate upload if you want to be explicit before switching device.

## GitHub Pages

The repository includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

For a project repository, the published URL will normally be:

`https://<your-github-username>.github.io/<repository-name>/`

Recommended setup:

1. Push this project to its own GitHub repository.
2. In the repository settings on GitHub, open `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to the `main` branch.
5. Wait for the `Deploy Pages` workflow to finish.

## Data export

Use the `Download JSON` button to save your current session. The exported file includes:

- Tasks
- Subtasks
- Status and completion timestamps
- Completion history used by the statistics page
- Dashboard settings such as weather location

It does not include your Firebase config or login session.

Use `Upload JSON` to restore that state after browser storage is cleared.

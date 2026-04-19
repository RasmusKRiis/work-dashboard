# Work Session Dashboard

A dependency-free dashboard inspired by the supplied reference image, focused on managing workday tasks with local browser persistence and JSON backup/restore.

## Features

- Warm editorial dashboard layout with serif headline type, mono labels, and card structure matching the reference.
- Daily task agenda with a week strip, quick-add flow, expandable task detail editor, notes, and subtasks.
- `Now / Next / Later` focus stack for the current working queue.
- Separate statistics view with four live modules based on your saved task and completion data.
- Three theme modes in the header: `Day`, `Night`, and `Hong Kong`.
- Local persistence in `localStorage`.
- JSON export and import so the full session can be downloaded and restored later.
- Weather side panel powered by Open-Meteo, with editable location lookup.
- Responsive layout tuned for both full-screen and small-screen use.
- GitHub Pages workflow for publishing the dashboard at a stable URL.

## Run

You can open [index.html](/Users/rasmuskopperudriis/Coding/projects/work_dashboard/index.html) directly in a browser, but a tiny local server is more reliable for live feed requests.

Example:

```bash
cd /Users/rasmuskopperudriis/Coding/projects/work_dashboard
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

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

Use `Upload JSON` to restore that state after browser storage is cleared.

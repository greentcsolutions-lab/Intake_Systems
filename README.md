Insurance Intake Form
A fully static, dynamic intake wizard for insurance agencies. Works on GitHub Pages — no backend required.
Deploy to GitHub Pages (Free)
Create a new GitHub repo (e.g. intake-form)
Upload index.html to the repo root
Go to Settings → Pages → Source → main branch / root
Your form is live at https://yourusername.github.io/intake-form
Done. Share that URL with your receptionist.
Google Sheets Integration
The form can POST data directly to a Google Sheet via Google Apps Script.
Step 1 — Create your Sheet
Create a new Google Sheet. Note the Sheet ID from the URL:
https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
Step 2 — Create an Apps Script Web App
In your Sheet, go to Extensions → Apps Script
Paste this code:
Javascript
Click Deploy → New Deployment → Web App
Set Execute as: Me, Who has access: Anyone
Copy the Web App URL
Step 3 — Plug URL into the form
When you click "Send to Google Sheets" in the form, paste your Web App URL. It saves in your browser for future submissions.
Lines of Business Covered
✅ Personal Auto (vehicles, drivers, lienholders, coverage)
✅ Home / Renters (property details, losses, mortgage)
✅ Commercial Auto (fleet, drivers, DOT)
✅ BOP / Commercial Property
✅ Life / Health (basic)
Conditional Logic / Flags
The form automatically flags:
Coverage lapses
Lienholders (triggers required Comp/Coll with warning)
Driver incidents (accidents, violations, DUI)
Young drivers (<25)
SR-22 requirements
Rideshare use
Unfenced pools, trampolines, restricted-breed dogs
Knob & tube wiring / fuse boxes
Roof age 15+ years
Tobacco use (life)
Outputs
📊 Excel download (multi-tab: summary, vehicles, drivers)
🔗 Google Sheets append (via Apps Script)
🖨️ Browser Print / Save as PDF
Notes
All data stays local in the browser — nothing is stored on a server
Google Sheets URL is saved in localStorage for convenience
No dependencies to install, no npm, no build step — just one HTML file

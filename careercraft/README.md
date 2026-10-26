# CareerCraft

A CV and cover letter builder with job matching, a screening check, a prompt library and an AI assistant.

## Run it
Open `index.html` in a browser. No build step or server is needed. An internet connection is needed for the fonts and the PDF library (jsPDF, loaded from cdnjs).

## Files
- `index.html` : page shell
- `css/style.css` : all styles, including dark mode and print rules
- `js/app.js` : all app logic (accounts, CV builder, templates, job match, prompts, PDF export)

## Notes
- Accounts and documents are saved in the browser's localStorage. This is a demo: passwords are not protected and data stays on one device.
- The "Assistant" tab needs the claude.ai runtime, so it shows a message when you open the files directly. To make it work elsewhere, replace the `ask` function in `js/app.js` with a call to your own backend that holds your AI API key. Never put an API key in this file.
- Export PDF uses jsPDF. If it is unavailable it falls back to the browser's print dialog.

# Desmond Kofi Boateng — research portfolio

Research-first personal website for Desmond Kofi Boateng, a PhD student in
Computing at Boise State University working on scientific machine learning,
operator learning, kernel methods, and numerical PDEs.

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## Update the website

- Edit homepage copy in `index.html`.
- Edit research descriptions in `_pages/research.html`.
- Add or update software projects in `_data/projects.yml`.
- Add presentations and milestones in `_data/outputs.yml`.
- Replace `assets/files/desmond_boateng_CV.pdf` when the CV changes. Keep the
  filename unchanged so links do not break, and remove private contact details.

Before publishing, run:

```bash
bundle exec jekyll build --destination dist
```

The production site is published from this repository with GitHub Pages.
See `MAINTENANCE.md` for the update cadence, publication checklist, and search
visibility plan.

# Portfolio maintenance plan

This website treats the current CV plus Desmond’s explicit corrections as the
authoritative source for education, experience, publications, and dates.

## Where to make updates

| Information | Source file |
| --- | --- |
| Homepage positioning and featured research | `index.html` |
| AKED, TreeAKED, and polyharmonic-spline descriptions | `_pages/research.html` |
| Public software projects | `_data/projects.yml` |
| Posters, talks, and manuscripts | `_data/outputs.yml` |
| Programs, grants, and milestones | `_pages/outputs.html` |
| Navigation | `_data/navigation.yml` |
| Public CV | `assets/files/desmond_boateng_CV.pdf` |
| Contact and social profiles | `_config.yml` |

Keep active research descriptions high-level until the manuscript or code is
ready for release. Do not publish private repositories, unpublished technical
details, a phone number, a home address, or personal identifiers.

## Update cadence

### After every accepted paper, poster, talk, award, or role change

1. Update the CV first.
2. Add the public-facing item to `_data/outputs.yml` or the relevant page.
3. Update homepage highlights only when the item is a strong current signal.
4. Build and validate the site.
5. Publish, then request recrawling for the changed page in Google Search Console.

### Monthly — five minutes

- Confirm that email, GitHub, LinkedIn, Scholar, project, and CV links work.
- Check that the homepage still leads with the most important current research.
- Remove “upcoming” language after an event has happened.

### Quarterly — 30 minutes

- Review every page against the current CV.
- Replace weaker projects or outputs with stronger recent work.
- Check Google Search Console for indexing, mobile usability, and search queries.
- Review page titles and descriptions for accuracy; do not rewrite them merely to
  chase keywords.

### Annually

- Refresh the portrait only if a clearly stronger professional photo exists.
- Reassess the homepage positioning for the next career goal.
- Archive outdated accomplishments rather than allowing the homepage to grow.

## Build and validate

The site is Jekyll-compatible for GitHub Pages and also has a dependency-free
static build for local checks:

```bash
npm run build
npm test
```

The validator checks metadata, JSON-LD, internal links, image alt text, unique
IDs, and required public assets. GitHub Actions runs the same checks on every
push and pull request.

## Publication checklist

- [ ] Dates, titles, coauthors, institutions, and grant amounts match the CV.
- [ ] The public CV contains no phone number or other private details.
- [ ] Active research text is approved for public release.
- [ ] `npm run build` succeeds.
- [ ] `npm test` succeeds.
- [ ] Desktop and mobile navigation are visually checked.
- [ ] The deployed homepage, CV, research page, `robots.txt`, and `sitemap.xml`
      return successfully.
- [ ] Search Console recrawling is requested for materially changed pages.

## Search visibility plan

Good technical SEO improves eligibility for search results, but no one can
guarantee a particular ranking or indexing date. Use these steps to strengthen
the name-to-website connection:

1. Verify `https://kofidesmondml.github.io/` in Google Search Console and Bing
   Webmaster Tools.
2. Submit `https://kofidesmondml.github.io/sitemap.xml` to both services.
3. Request indexing for the homepage, Research, Outputs, and CV pages after the
   redesign is live.
4. Add the portfolio URL to the GitHub profile, LinkedIn contact information,
   Google Scholar homepage field, Boise State profile, conference bios, and
   future papers or posters where appropriate.
5. Use the same full name—“Desmond Kofi Boateng”—across those profiles.
6. Publish substantive updates when there is real new research; avoid thin or
   repetitive posts created only for search engines.

The structured Person data, canonical URLs, descriptive titles, social preview,
robots policy, and sitemap are already part of the site.

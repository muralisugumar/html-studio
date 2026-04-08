# HTML Studio

Static Next.js frontend with two separate tools:

1. Live HTML editor
2. HTML splitter

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The app uses `output: "export"` in [`next.config.mjs`](/C:/Users/mural/OneDrive/Documents/testcodex/next.config.mjs), so it can be deployed as a static site on Vercel or Netlify.

## Features

- HTML file upload only
- Client-side iframe editing with direct visual content edits
- Full HTML export as a single file from the editor
- HTML body, CSS, JS, and section extraction in the splitter
- Responsive UI with separate tabs so the two workflows do not mix

# Primate Aging Data Visualization

Interactive web application for exploring and visualizing primate aging biomarker data. Displays scatter plots of various health measurements across age, with filtering by species, sex, social environment, housing, and diet.

## Features

- **Interactive scatter charts** with zoom, pan, and drag-to-zoom
- **Multi-dimensional filtering** by species, sex, social environment, housing, and diet
- **Overlay comparison** to compare two measurements or filter sets side-by-side
- **Statistical summaries** showing mean and median per age group
- **65+ biomarkers** including blood chemistry, hematology, and vital signs

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js with zoom plugin
- **Deployment**: Cloudflare Pages

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   This automatically preprocesses CSV data to optimized JSON before starting the dev server.

3. **Open in browser**: http://localhost:5173

## Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Deployment is configured for Cloudflare Pages via `wrangler.jsonc`.

## Project Structure

```
├── src/
│   ├── routes/
│   │   └── +page.svelte      # Main application page
│   └── lib/
│       ├── components/       # Svelte components
│       │   ├── ScatterChart.svelte
│       │   ├── FilterGroup.svelte
│       │   └── MeasurementDropdown.svelte
│       ├── csv-utils.ts      # Data loading utilities
│       └── types.ts          # TypeScript definitions
├── scripts/
│   └── preprocess-csv-to-json.js   # CSV to JSON optimizer
├── static/
│   ├── data/                 # Source CSV files
│   └── data-optimized/       # Generated JSON (built at dev/build time)
└── data/                     # Raw/processed data (not served)
```

## Data Pipeline

1. **Source data** lives in `static/data/` as CSV files
2. **Preprocessing** (`npm run preprocess`) converts CSV to optimized JSON
3. **Optimized JSON** is written to `static/data-optimized/`
4. **Web app** fetches the optimized JSON for fast loading

The preprocessing step runs automatically before `dev` and `build`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (includes preprocessing) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Run TypeScript type checking |
| `npm run preprocess` | Convert CSV data to optimized JSON |

## Data Format

### subjects.csv
Contains subject metadata: species, sex, social environment, housing, diet.

### measurements.csv
Maps filenames to measurement names and units.

### Biomarker files (e.g., primateglucose.csv)
Contains subject ID and values at each age (columns: subject, y1, y2, ... yN).

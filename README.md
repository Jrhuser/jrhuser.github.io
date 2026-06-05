# The Pump Room — Neptune Benson / Xylem Aquatics Sales Toolbox

A static, client-side web app that helps sales reps and customers size, configure, and request quotes for **Neptune Benson** (Xylem) aquatics equipment — filtration, pumps, and UV disinfection. Everything runs in the browser with no backend; product data lives in a JSON file and quotes are generated as pre-filled `mailto:` emails.

Hosted via **GitHub Pages** at `https://jrhuser.github.io/`.

---

## What it does

The site is a collection of standalone HTML tools that share a common stylesheet (`style.css`) and product database (`product.json`). The main entry point is the **Equipment Selector**, with links out to the other tools.

### 1. Equipment Selector — [`index.html`](index.html)

The core sizing tool. It builds a "Pump Room" bill of materials from a target flow rate.

- **Project details** — optional project name, system name, and project zip code (used for freight estimates and sales-rep routing).
- **Flow rate input** — enter the **Design Flow Rate (GPM)** directly, *or* enter **Pool Volume** + **Required Turnover** (minutes / hours / turnovers-per-day) and the tool back-calculates the flow rate. The volume / turnover / flow fields stay in sync as you edit them.
- **Equipment groups** (select one or more):
  - **Filtration** — choose **Regenerative Media (RMF / Defender)** or **Sand Filtration**. RMF adds a **Ceiling Height** constraint (8'–>10') that filters out models too tall for the room (footprint height is parsed from the data). RMF results are sorted by list price (lowest first).
  - **Pumps** — choose voltage (230/460V or 575V) and drive (**Pump Only** or **Green Drive VFD**).
  - **Disinfection (UV)** — choose enclosure rating (**NEMA 4X** outdoor / **NEMA 12** indoor).
- **Matching logic** — for each selected group, products are filtered by the secondary options, then matched against the flow rate's min/max range. If the flow exceeds every model's max flow, the tool selects the largest model and calculates how many **units in parallel** are needed (`ceil(flow / maxFlow)`), distributing flow per unit (e.g. NSF filtration-rate flux is computed per unit).
- **Bill of Materials** — results render in per-group tables (Filtration / Pumps / UV) with model, quantity, flow range, performance figures (NSF 2.0/3.0 filtration rates, pump BEP/TDH, UV max flow at 60 mJ/cm²), footprint, and links to technical PDFs in `product/`.
- **Download all docs** — `Download Files for all Selections` bundles every spec sheet, datasheet/pump curve, and written spec for the checked items into a single ZIP (built in-browser with JSZip). Pump selections automatically include the Green Drive VFD sheet.
- **Add / Request Quote** — `Add/Request Quote` accumulates the current configuration as a named "system," then opens a pre-filled email to the inside-sales address with project details, every accumulated system's parameters and products, a freight-quote request for the zip code, and any applicable promotions. Multiple systems can be added to one quote before sending.
- **Sales-rep CC routing** — the project zip code (US zip or Canadian postal code) is mapped to a state/province, and the matching rep from `product.json`'s `sales-reps` list is CC'd on the quote email automatically.
- **Promotional upgrades** — a "Promotional Upgrade" section captures whether the job is a trade-in (Neptune Benson equipment by serial number, or competitive equipment by brand/model) and appends the relevant promo offers to the quote.
- **Deep-link parameters** — the page reads URL query params so other pages can preconfigure it:
  - `?select=UV,Filter,Pump` — pre-checks equipment groups
  - `?filterType=RMF` — pre-selects filter technology
  - `?promo=Yes` — turns on the promotional-upgrade flow

### 2. Defender ROI Calculator — [`defender-roi.html`](defender-roi.html)

A self-contained **10-year life-cycle cost analysis** comparing a **Defender regenerative media filter** against a conventional **sand filter**.

- Enter project info and up to **10 pools** (description, indoor/outdoor, flow rate).
- Enter filter purchase prices plus a large set of operational-cost assumptions (mechanical space value, backwash rate/duration/frequency, water/sewer/chemical/gas/electric rates, heat delta, annual cost escalation, compressors, tool kits — all pre-populated with sensible defaults).
- An internal lookup table maps each pool's flow to matched sand vs. Defender model sizing (square footage, media volume, footprint, tank volume, list price).
- Outputs:
  - **KPI summary** — annual water savings (gal), electrical savings (kWh), energy savings (BTUs), and total 10-year savings ($).
  - **Cost comparison table** — capital costs, year-1 annual operating costs, and 10-year life-cycle totals with per-line variance.
  - **10-year forecast chart** — cumulative cost curves for both technologies (Chart.js), with costs escalated annually.
  - **Print / Save PDF** — print-optimized layout for handing a customer a clean report.

### 3. Promotions — [`promotions.html`](promotions.html)

A landing page of current promotional programs as cards, each linking to the relevant configurator:

- **UV Panel Upgrade (Spectra III)** → `uv-panel-upgrade.html`
- **UV System Upgrade (Wafer)** → `index.html?select=UV&promo=Yes`
- **Filtration System Upgrade (Defender)** → `index.html?select=Filter,Pump&filterType=RMF&promo=Yes`
- Placeholder card for future promotions.

### 4. Spectra III Panel Upgrade Configurator — [`uv-panel-upgrade.html`](uv-panel-upgrade.html)

A guided, step-by-step quote builder for re-powering legacy ETS-UV systems with the Spectra III control platform (without replacing the reactor).

- Step 1: pick UV model (SP-25, ECF-210 … ECF-430).
- Step 2: pick intensity sensor (AT-900 / AT-463).
- Step 3: pick cable length (30 ft / 100 ft).
- Step 4: optionally add **PM parts** to qualify for a 5-year warranty extension.
- Step 5: enter serial number; Step 6: apply a discount percentage.
- A live **quote table** assembles the correct part numbers and prices (all pricing data is embedded in the page) and computes list vs. discounted totals.
- **Request Quote** opens a pre-filled email (with a copy/paste-ready part-number list) to the ETS-UV order desk; **Publish** prints a clean PDF-ready version.

### 5. Sales Literature — [`sales-literature.html`](sales-literature.html)

A simple card grid linking to product brochures and spec PDFs (Defender, ETS-UV, Guardian sand filters, Spectra III).

---

## Project structure

```
.
├── index.html              # Equipment Selector (main tool)
├── defender-roi.html       # Defender vs. sand filter ROI calculator
├── promotions.html         # Promotions landing page
├── uv-panel-upgrade.html   # Spectra III panel upgrade quote builder
├── sales-literature.html   # Brochure / spec download links
├── script.js               # Logic for the Equipment Selector
├── style.css               # Shared site styling (Xylem branding)
├── product.json            # Product database + sales-rep territory map
├── product/                # Technical PDFs: spec sheets, cut sheets, datasheets, CAD
├── Images/                 # Logos, equipment icons, sensor photos
└── *.pdf / *.xlsx          # Reference sales sheets and source analysis files
```

### `product.json`

The single source of truth for the Equipment Selector. Two top-level keys:

- **`product-DB`** — an array of product records (filters, UV units, pumps). Notable fields:
  - `Grouping` (`Filter` / `UV` / `Pump`), `Equipment Type` (e.g. `RMF`, `Sand Filter`), `Model`, `Part Number`
  - Flow data: `Min Flow (gpm)`, `Max Flow`, `Best Efficiency Flow (gpm)`, `Max Flow (60 mj/cm^2)`
  - Filter performance: `NSF 2.0 / 3.0 Filter Area (sq ft)`, `Footprint LxWxH (Inches)`
  - Pump performance: `Power` (voltage), `HP`, `TDH`, `TDH @ Best Efficieny`
  - UV: `Nema Rating`
  - `List Price`, and document filenames: `Product Sheet`, `Additional Info/Pump Curve`, `Written Specification` (all resolved relative to `product/`)
- **`sales-reps`** — maps each rep's email to a list of US states / Canadian provinces, used to auto-CC the right rep on quote emails based on the project zip/postal code.

To add or update products, edit `product.json` and drop any referenced PDFs into `product/`.

---

## Running locally

It's a fully static site — no build step. Because the Equipment Selector fetches `product.json` over `fetch()`, you need to serve it over HTTP (opening `index.html` directly via `file://` will fail the fetch).

```powershell
# from the repo root, using Python
python -m http.server 8000
# then open http://localhost:8000/
```

Any static file server works (`npx serve`, VS Code Live Server, etc.).

## Editing with Claude Code (desktop app)

You don't need to know git or write code by hand — you can do the whole pull → edit → publish cycle by talking to **Claude Code** in plain English. This section assumes you've already installed the Claude Code desktop app and have the repo on your machine (it was originally cloned from `https://github.com/Jrhuser/jrhuser.github.io.git`).

### One-time setup

1. Open the **Claude Code** desktop app.
2. Point it at this project folder (the folder that contains `index.html` and `product.json`). Claude works inside whatever folder you open.
3. Make sure you're signed in to GitHub so pushes are allowed. If a push ever fails with an authentication error, tell Claude *"I need to authenticate with GitHub"* and follow its instructions (it will typically have you run `gh auth login`).

### The everyday workflow

Each time you want to make a change, ask Claude to do these three things in order:

1. **Pull the latest version first** so you're editing the current live site, not a stale copy:

   > "Pull the latest changes from GitHub."

   (Claude runs `git pull` for you.)

2. **Describe the edit you want in plain language.** You don't have to know which file it lives in — Claude does. Examples:

   > "Add a new 30 HP pump to the product list: 575V, part number 1003-XXXX, min flow 1200, max flow 1500."
   >
   > "Change the Defender filter price for the SP-33-48-732 to $95,000."
   >
   > "Update Kari's sales territory to also include Texas."
   >
   > "Add a new promotion card for a winterization special."

   Claude will find the right file (`product.json`, one of the HTML pages, etc.), make the edit, and tell you what it changed. Ask it to show you the change if you want to review it.

3. **Publish it.** When you're happy with the change:

   > "Commit this with a message describing the change and push it to GitHub."

   Claude commits and pushes; GitHub Pages updates the live site at `https://jrhuser.github.io/` within a minute or so. Hard-refresh the page (Ctrl+F5) to see it.

### Tips

- **Preview before publishing.** You can ask *"Run the site locally so I can check it"* and Claude will start a local server and give you a `http://localhost:...` link to review before you push.
- **Ask it to double-check the data file.** After editing `product.json`, say *"Validate the JSON"* — a stray comma there can silently break the Equipment Selector, and Claude can catch it before it goes live.
- **You can undo.** If something looks wrong after a change, ask *"Undo the last change"* or *"Revert the last commit"* and Claude will walk it back.
- **One change at a time.** Pull → edit → review → push in small steps. It keeps the history clean and makes it easy to back out a single change if needed.

## Maintaining & updating

Because there's no build step or backend, maintenance is mostly editing data files and HTML, then committing. Here's where to make the common changes:

### Add, edit, or remove a product (Equipment Selector)

1. Edit **`product.json`** → the `product-DB` array. Copy an existing record of the same `Grouping` and adjust its fields. Key things to get right:
   - `Grouping` must be exactly `Filter`, `Pump`, or `UV`.
   - For filters, `Equipment Type` must match a dropdown value (`RMF` or `Sand Filter`); for pumps, `Power` must match a voltage option (`230/460` or `575`); for UV, `Nema Rating` must match (`N4x` or `N12`).
   - `Min Flow (gpm)` / `Max Flow` define the flow-matching range. Leave `Max Flow` as `null` for an open-ended top end.
   - For RMF filters, `Footprint LxWxH (Inches)` is parsed for the **height** (last value) to enforce the ceiling-height filter, and `List Price` drives the lowest-price-first sort.
2. Put any referenced PDFs in **`product/`**. The `Product Sheet`, `Additional Info/Pump Curve`, and `Written Specification` fields are filenames resolved relative to `product/` — the filename in the JSON must match the file exactly (including extension and spaces).
3. Validate the JSON before committing (a trailing comma or missing quote will silently break the whole selector — the page just shows no results). For example: `Get-Content product.json -Raw | ConvertFrom-Json` in PowerShell, or `python -m json.tool product.json`.

### Update sales-rep territories

Edit the `sales-reps` array in **`product.json`** — each entry has `name`, `email`, and a `states` list (US state + Canadian province codes). The zip/postal-code → state mapping itself lives in `getStateFromZip()` in [`script.js`](script.js); you only need to touch that function if a code range is wrong or you're adding new geography.

### Update the Spectra III upgrade pricing/parts

All of that data is **hard-coded inside [`uv-panel-upgrade.html`](uv-panel-upgrade.html)** (not in `product.json`) — see the `panelData`, `cableData`, and `pmPartsData` objects in the inline `<script>`. Edit those objects to change part numbers, descriptions, or prices.

### Update the Defender ROI model

The sizing/pricing lookup table (`lookupTable`) and cost constants (`compressorPrice`, `toolKitPrice`) are hard-coded in the inline `<script>` in [`defender-roi.html`](defender-roi.html). Default assumption values (water/sewer/energy rates, escalation, etc.) are set as `value="..."` attributes on the input fields in the same file.

### Add or change a promotion

Edit [`promotions.html`](promotions.html) — duplicate a `.promo-card` block and point its button at the right configurator (a deep link into `index.html?select=...&filterType=...&promo=Yes`, or a dedicated page). If the promo should also appear in quote emails, update the promo text in the `addToCartButton` handler in [`script.js`](script.js).

### Styling / branding

Shared styles live in [`style.css`](style.css); the ROI, promotions, and panel-upgrade pages also have page-specific `<style>` blocks inline. Brand colors are teal `#007DA3` and green `#61D604`.

## Deployment

The repo is named `jrhuser.github.io`, which makes it a **GitHub Pages user site** served from the repo root at `https://jrhuser.github.io/`. There is no build pipeline — GitHub publishes the files as-is from the branch configured under **Settings → Pages** (typically `main`).

To deploy a change:

```powershell
git add -A
git commit -m "Describe your change"
git push
```

Within a minute or so of the push, GitHub Pages rebuilds and the live site reflects the change. Notes:

- Test locally first (see **Running locally**) — there's no staging environment, so a push goes straight to production.
- Hard-refresh (Ctrl+F5) when verifying, since browsers cache `product.json`, `script.js`, and `style.css`.
- If the site doesn't update, check **Settings → Pages** for the build status and confirm you pushed to the branch Pages is configured to serve.

## Tech notes

- Vanilla HTML / CSS / JavaScript — no framework, no bundler.
- External libraries loaded via CDN: **JSZip** (bundle downloads), **Chart.js** (ROI chart), **Font Awesome** + **Google Fonts (Roboto)**.
- Quotes are delivered through `mailto:` links, so the user's email client opens with the request pre-filled — there is no server-side processing or data storage.
- Branding follows Xylem colors (teal `#007DA3`, green `#61D604`).

© Xylem Inc.

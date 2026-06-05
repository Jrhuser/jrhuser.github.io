# The Pump Room — Neptune Benson / Xylem Aquatics Sales Toolbox

This is the website behind **The Pump Room**, a set of online sales tools for Neptune Benson (Xylem) aquatics equipment — filters, pumps, and UV disinfection. Sales reps and customers use it to size equipment, compare costs, and request quotes.

**The live site:** https://jrhuser.github.io/

You don't need to know anything about web development or GitHub to keep this site up to date. You make every change by **talking to Claude Code in plain English** — Claude finds the right place, makes the edit, and publishes it for you. This guide explains the tools and walks you through making changes.

---

## What's on the site

The site has five pages that all work together.

### 1. Equipment Selector (the main page)

The home page and the heart of the tool. You enter a pool's flow rate (or its volume and turnover, and it figures out the flow rate), pick which equipment you need — filtration, pumps, and/or UV — answer a few questions about each, and it produces a recommended **bill of materials**: the right models for that flow, with their specs and links to the technical PDFs.

From there you can:
- **Download all the technical documents** for the selected items as a single zip file.
- **Request a quote** — this opens a pre-filled email to inside sales with the project details and selected equipment. If you entered a project zip code, it automatically copies the right regional sales rep on the email.
- Apply **promotional upgrades** (trade-ins, etc.) that get added to the quote.

### 2. Defender ROI Calculator

A cost-comparison tool that shows the **10-year savings** of a Defender regenerative media filter versus a traditional sand filter. You enter your pools and some cost assumptions (water rates, energy rates, etc. — it comes pre-filled with reasonable defaults), and it produces savings figures, a comparison table, and a chart. It can be printed or saved as a PDF to hand to a customer.

### 3. Promotions

A page of current promotional offers, shown as cards. Each card links to the right tool for that promotion.

### 4. Spectra III Panel Upgrade

A step-by-step quote builder for upgrading older ETS-UV systems to the Spectra III control panel. You pick the UV model, sensor, cable length, and warranty options, and it builds a quote with the correct part numbers and prices that can be emailed or printed.

### 5. Sales Literature

A simple page of links to product brochures and spec sheets.

---

## Making changes (everything through Claude Code)

This is how you'll do all your updates. You never have to edit files by hand or learn any commands — you just describe what you want.

### First time only

1. Open the **Claude Code** desktop app.
2. Open this project folder (the folder that contains all the website files). Claude works inside whatever folder you open.
3. Make sure you're signed in to GitHub. If Claude ever tells you a change couldn't be published because of a sign-in problem, just say *"Help me sign in to GitHub"* and follow along.

### Every time you make a change

Do these in order. The exact words don't matter — just say it naturally.

**Step 1 — Get the latest version.** Before editing, say:

> "Get the latest version of the site."

This makes sure you're working from what's currently live, not an old copy.

**Step 2 — Describe your change.** You don't need to know where anything lives — Claude does. For example:

> "Add a new 30 HP pump: 575 volt, part number 1003-9999, minimum flow 1200, maximum flow 1500."
>
> "Change the price of the Defender SP-33-48-732 filter to $95,000."
>
> "Add Texas to Kari's sales territory."
>
> "Add a new promotion card for a winterization special."
>
> "Fix the typo on the promotions page where it says 'Disinfeciton'."

Claude makes the edit and tells you what changed. If you want to see it first, just say *"Show me what you changed."*

**Step 3 — Preview it (optional but recommended).** To look at the change before it goes live, say:

> "Show me the site so I can check it."

Claude will open a local preview and give you a link. This preview is private to your computer — nobody else sees it.

**Step 4 — Publish it.** When you're happy:

> "Publish this change."

Claude saves and uploads the change. The live site at https://jrhuser.github.io/ updates within a minute or two. If you don't see the change right away, refresh the page with **Ctrl+F5** (a "hard refresh" that ignores the browser's saved copy).

### If something goes wrong

- **Undo a change you haven't published yet:** *"Undo that last change."*
- **Undo a change you already published:** *"Revert the last published change."* Claude will walk it back and publish the fix.
- **Not sure if it published?** Ask *"Is everything published?"* and Claude will check.

---

## Common changes and what to say

Here are the things you'll most often want to change, and a plain-English request for each. You can always just describe what you want — these are starting points.

| You want to… | Say something like… |
| --- | --- |
| Add, edit, or remove a product (filter, pump, UV unit) | *"Add this filter to the product list: [details]"* / *"Remove the NB530 5 HP pump"* |
| Change a product's price, flow range, or specs | *"Change the max flow on the [model] to 1500"* |
| Attach a spec sheet or brochure to a product | *"Attach this PDF to the [model] — I've put the file in the project folder"* (drop the PDF in the folder first) |
| Change which sales rep covers which states | *"Update the sales territories — give Texas to Jesus instead of Kari"* |
| Add, edit, or remove a promotion | *"Add a promotion card for [offer]"* |
| Update Spectra III upgrade prices or parts | *"Update the price of the ECF-220 panel to [amount]"* |
| Update the ROI calculator's pricing or assumptions | *"Update the default electricity rate in the ROI calculator to $0.14"* |
| Fix a typo or change wording anywhere | *"Fix the wording on [page] that says…"* |

**One tip worth knowing:** the product list is kept in a data file that has to be formatted just right — one misplaced comma can quietly break the Equipment Selector so it shows no results. You don't need to understand the format, but after Claude edits the product list, it's worth saying *"Double-check the product data file is still valid."* Claude can verify it before it goes live.

---

## How publishing works (the short version)

This site is hosted on **GitHub Pages**, a free service that turns the project files directly into a public website. There's no separate "deploy" step or staging site — when Claude publishes a change, it goes straight to the live site within a minute or two.

Because there's no staging area, two good habits:
- **Preview before you publish** when the change is more than a tiny wording fix.
- **Make one change at a time** rather than batching several together. It's easier to review, and easier to undo just one thing if needed.

---

## Where things live (reference)

You don't need this to make changes — Claude finds the right file for you — but if you're curious, here's roughly what's what:

- **The main Equipment Selector page** and its behavior — the home page files.
- **The product list** (every filter, pump, and UV unit, plus the sales-rep territories) — a single data file Claude edits when you add or change products.
- **The Defender ROI Calculator**, **Promotions**, **Spectra III Panel Upgrade**, and **Sales Literature** — each is its own page.
- **Technical PDFs** (spec sheets, brochures, datasheets) — kept in a documents folder; these are what the "download documents" feature pulls from.
- **Images** (logos, equipment photos) — kept in an images folder.

If you ever want a guided tour of any of these, just ask Claude: *"Walk me through how the [tool] works."*

---

© Xylem Inc.

# Invoice Generator

A simple client-side invoice generator. Fill in your company details, add line items, apply taxes and discounts, and preview or download the invoice as a PDF.

## Features

- Edit / Preview tabs
- Company info with logo upload, From/To fields
- Line items with quantity, price, per-item currency and discount (percentage or fixed amount)
- Invoice-level discount and tax rate
- Multi-currency support
- Light / Dark / System theme toggle
- PDF export (via browser print)

## Run locally

Just open `index.html` in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

## Deploy

This is a static site with no build step, so it deploys as-is to Vercel, Netlify, GitHub Pages, or any static host.

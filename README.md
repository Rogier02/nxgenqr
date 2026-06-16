# NXGenQR

A free, open source QR code generator. No paywalls, no sign-up, no tracking,
no "upgrade to download" — just a link in, a QR code out.

## Why

Most QR code generators you find online gate basic features (high-res
downloads, vector formats, even just "no watermark") behind a paywall.
NXGenQR exists to be the tool that's just... free. Forever, by license.

## Features

- One field, one button — nothing else to learn.
- Everything runs **entirely in your browser**. Your link is never sent
  anywhere, logged, or stored — there is no server involved in generating
  the code.
- Choose a size: Small (256px), Medium (512px), Large (1024px), or
  X-Large (2048px).
- Download in the format that fits what you're doing with it:
  - **PNG** — general purpose, supports transparency-friendly workflows.
  - **SVG** — vector, scales to any size without quality loss; best for
    print, posters, business cards.
  - **JPG** — small file size, universally compatible.
  - **WebP** — modern format, smallest file size (support depends on
    your browser).

## Running it locally

There's no build step. Either:

- Open [index.html](index.html) directly in a browser, or
- Serve the folder with any static file server, e.g.:
  ```bash
  npx serve .
  # or
  python3 -m http.server
  ```

## Project structure

```
index.html              the page
css/style.css           styling
js/app.js                generation, sizing, and download logic
js/vendor/qrcode-generator.js   third-party QR encoding library (MIT)
assets/                  favicon etc.
```

## Roadmap

- [x] Core generator: link in, QR out, multiple sizes and file formats.
- [ ] Donations: a "support open source" section already exists in the
      code (see `FEATURES.donations` in [js/app.js](js/app.js)) but is
      switched off until a real payment + transparent-ledger backend
      (e.g. Stripe + a small donation tracker, or an existing platform
      like Open Collective) is built and wired up.
- [ ] Eventually: a small hub of free, open source tools like this one —
      in the spirit of Wikipedia, run for users rather than for profit.

## License

Licensed under the [Apache License 2.0](LICENSE).

This project bundles
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by
Kazuhiko Arase, used under the MIT license — see [NOTICE](NOTICE) for
details. "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

## Contributing

Issues and pull requests are welcome at
[github.com/Rogier02/nxgenqr](https://github.com/Rogier02/nxgenqr) — it's
a small, deliberately simple codebase, so it should be easy to read end
to end before changing anything.

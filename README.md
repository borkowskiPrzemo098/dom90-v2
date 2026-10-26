# DOM90 v2

Propozycja nowej wersji strony [dom90.com](https://dom90.com/) — statyczny HTML/CSS/JS.

- Źródła stron: `src/pages/*.html`, wspólne fragmenty: `src/partials/`
- Budowanie: `node build.mjs` (składa strony do katalogu głównego, który serwuje GitHub Pages)
- Style: `assets/style.css`, skrypty: `assets/app.js`, zdjęcia: `assets/img/`

Przed wdrożeniem na dom90.com usuń `<meta name="robots" content="noindex">` z `src/partials/head.html`.

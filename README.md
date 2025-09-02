# ESWatch (React + Vite)

## Environment variables

Create a `.env` file (or copy `.env.example`) and set your PandaScore token:

```
VITE_PANDASCORE_TOKEN=your_pandascore_token
```

The app reads this value in `src/services/pandascore.js`.

## Dev scripts

- `npm run dev` – start Vite dev server
- `npm run build` – build for production
- `npm run preview` – preview the production build

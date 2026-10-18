# Rolling Amount

A small motion study on the loan amount field from my WeChat Pay lending work.
The screen is the same; only the way the number changes is new.

**[Try it live →](https://shuyii0315-arch.github.io/rolling-amount/)**

![The top of the loan page with the amount ¥8000](docs/rolling-amount.png)

## What moves

| Action | Motion |
|---|---|
| Type a digit | It rises in from below with a short blur and a little spring. Earlier digits stay still. |
| Delete | The last digit drops and fades, faster than it came in. |
| Caret | Each digit's width grows from 0 or shrinks to 0, so the caret glides instead of jumping. |
| Jump to an amount | Every column spins to its new digit, right to left, like an odometer. |

On a computer, type on your keyboard. On a phone, tap the amount to bring up the number pad.
The presets under the phone jump between ¥8,000, ¥1,500 and ¥800. Replay plays a short scripted run.

## How it works

Each digit is a column: a vertical strip of 0–9 behind a 44 px window. Changing a digit only
moves the strip, so a jump from 8 to 1 reads as a roll, not a swap. New columns animate their
width from 0, leaving columns animate back to 0, and the caret is simply the next element in the row.

Everything is in [`src/App.jsx`](src/App.jsx) (`RollingDigits`) and [`src/index.css`](src/index.css).
`prefers-reduced-motion` turns the movement off.

## Run it

```bash
npm install
npm run dev
npm run build   # static build in dist/
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## Notes

- Numbers use WeChat Sans when it is installed, otherwise Roboto (bundled, Apache 2.0), the closest open match. WeChat Sans is not included.
- The full loan page this comes from: [offer-row](https://github.com/shuyii0315-arch/offer-row).

Designed and built by Shuyi Yuan.

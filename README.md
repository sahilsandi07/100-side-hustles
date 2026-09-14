# 100 Side Hustles — Product Site

Pages:
- `index.html` — the sales page you'll run Meta ads to
- `checkout.html` — your own branded checkout page (order summary + payment)
- `download.html` — only unlocks after a **verified** Razorpay payment

Flow: **index.html → checkout.html → Razorpay checkout (in-page) → download.html (verified) → PDF**

## 1. Deploy to Netlify

1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page (make sure the `netlify` folder with `functions` inside comes along — it holds the security logic and the ebook file itself)
3. Netlify gives you a live URL like `https://random-name-123.netlify.app`

## 2. Set your Razorpay secret key (required — nothing works without this)

The download page is protected by a Netlify Function that checks a cryptographic signature from Razorpay. It needs your **Key Secret** to do that:

1. Razorpay Dashboard → **Settings → API Keys** → copy your **Key Secret** (not the Key ID)
2. Netlify → your site → **Site settings → Environment variables → Add a variable**
3. Key: `RAZORPAY_KEY_SECRET`
4. Value: paste your Key Secret
5. Save, then **redeploy** the site (environment variables only apply after a redeploy)

**Never** put this secret in any HTML/JS file or share it in chat — it's what makes the signature check unforgeable. Netlify's environment variables are the only place it should live.

## 3. Connect the redirect after payment

Razorpay Dashboard → Payment Button → open the button for `pl_TboClL8loWEJkU` → find **Redirect URL after payment** → set it to:

```
https://your-site.netlify.app/download.html
```

Razorpay automatically appends the payment confirmation details to this URL when it redirects a successful buyer — that's what `download.html` checks.

## 4. How the protection actually works

- `download.html` on its own shows nothing useful. It reads a few parameters Razorpay attaches to the URL (`razorpay_payment_id`, `razorpay_signature`, etc.) and asks a Netlify Function to verify them.
- That function (`netlify/functions/verify-payment.js`) recomputes the expected signature server-side using your secret key. Only Razorpay could have produced a signature that matches — nobody can fake this by guessing or editing the URL.
- The actual PDF file lives **inside** `netlify/functions/` (as `ebook.pdf`), not in the public site folder. There is no static link to it anywhere. The only way to get the file is through `netlify/functions/download.js`, which re-checks the same signature before returning it.
- So: no valid Razorpay payment → no file. Someone bookmarking or sharing the download.html URL after use gets nothing, because the one-time link only carries a valid signature right after Razorpay's own redirect.

## 5. Update the price everywhere

The price appears as **₹499** (placeholder) in a few places. Search for `EDITABLE PRICE` comments:
- `index.html` — top bar, hero, pricing card, final CTA band
- `checkout.html` — order summary line items

Make sure these match the amount configured on your Razorpay Payment Button.

## 6. Before running Meta ads

- Test the **full real flow** on your live Netlify URL: `index.html` → "Get the Ebook" → `checkout.html` → pay a real ₹499 → confirm you land on `download.html` and the PDF actually downloads.
- Also test that visiting `download.html` directly with no parameters shows the "Access Denied" state, not the download button.
- Meta is strict about income claims — the copy avoids "guaranteed income" language on purpose. Keep any ad copy in the same spirit.
- Add your Meta Pixel to the `<head>` of `index.html` and `checkout.html` if you want conversion tracking.

## File structure

```
index.html                          → sales page
checkout.html                       → branded checkout page
download.html                       → verifies payment, then unlocks download
assets/style.css                    → shared design system
assets/img/                         → cover, author photo, preview screenshots
netlify.toml                        → Netlify config (functions directory, caching)
netlify/functions/verify-payment.js → checks Razorpay signature, returns JSON
netlify/functions/download.js       → checks signature again, then streams the PDF
netlify/functions/ebook.pdf         → the actual ebook file (never public otherwise)
```

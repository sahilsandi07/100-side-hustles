# 100 Side Hustles — Product Site

Three pages:
- `index.html` — the sales page you'll run Meta ads to
- `checkout.html` — your own branded checkout page (order summary + payment)
- `download.html` — the page a buyer lands on after paying

Flow: **index.html → checkout.html → (Razorpay) → download.html**

## 1. Deploy to Netlify

1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page
3. Netlify gives you a live URL like `https://random-name-123.netlify.app`
4. Optional: rename the site or connect your own domain in Site settings → Domain management

## 2. How checkout.html works right now

`checkout.html` is a proper page on **your own site** — not Razorpay's — with your book, price and what's included, so the buyer never feels like they've left your brand. Right now, the "Pay ₹499 Securely" button on it links out to your Razorpay page (`rzp.io/rzp/sOF0TqBo`) to actually take the payment, then Razorpay sends them back to you.

This works today with zero setup. But there's a better version available — see below.

## 3. Upgrade to a fully in-page checkout (no redirect at all)

Right now the buyer still briefly visits Razorpay's own page to enter card/UPI details. If you want the payment box to open **directly on your `checkout.html` page** with no redirect anywhere, do this:

1. Razorpay Dashboard → **Payment Button** → **Create Payment Button** (this is a different feature from the "Payment Page" link you shared — look for it in the left sidebar)
2. Set the amount to ₹499 (or your actual price) and save
3. Razorpay gives you a code snippet containing something like:
   `data-payment_button_id="pl_XXXXXXXXXXXXXX"`
4. Open `checkout.html`, find the big comment block that says **TRUE IN-PAGE CHECKOUT**
5. Paste your real `pl_...` ID into the `data-payment_button_id` attribute
6. Delete the "FALLBACK" button block right below it
7. Remove the HTML comment markers around the form/script block so it becomes live
8. Redeploy to Netlify

Once that's done, clicking "Pay" opens Razorpay's secure checkout as an overlay right there on your page — genuinely integrated, no redirect.

**Bonus:** in Razorpay Dashboard → Account & Settings, you can set your logo and brand color so the checkout overlay itself matches your gold/navy theme.

## 4. Connect the redirect after payment (works for either option above)

Whichever payment method you use, tell Razorpay where to send buyers once they've paid:

- **If using the Payment Page link** (current fallback): Dashboard → Payment Pages → open `sOF0TqBo` → find **Redirect URL** → set it to `https://your-site.netlify.app/download.html`
- **If using a Payment Button** (the upgrade above): the Payment Button creation screen has the same "Redirect URL after payment" field — set it the same way

## 5. Update the price everywhere

The price appears as **₹499** (placeholder) in a few places. Search for `EDITABLE PRICE` comments to find every spot:
- `index.html` — top bar, hero, pricing card, final CTA band
- `checkout.html` — order summary line items

Make sure all of these match whatever amount is actually configured in Razorpay.

## 6. Before running Meta ads

- Test the full flow yourself with a real payment: `index.html` → "Get the Ebook" → `checkout.html` → "Pay" → complete payment → land on `download.html` → confirm the PDF downloads.
- Meta is strict about income claims. The copy throughout avoids "guaranteed income" language on purpose — keep any ad copy you write in the same spirit.
- Add your Meta Pixel to the `<head>` of `index.html` and `checkout.html`, and fire a Purchase event on `download.html`, if you want conversion tracking. Not included by default since it needs your own Pixel ID.

## File structure

```
index.html                              → sales page
checkout.html                           → your branded checkout page
download.html                           → post-payment delivery page
assets/style.css                        → shared design system
assets/img/cover.jpg                    → book cover
assets/img/author.jpg                   → your photo
assets/img/preview1.jpg, preview3.jpg, preview4.jpg  → sample page screenshots
assets/files/100-side-hustles-ebook.pdf → the actual ebook buyers download
netlify.toml                            → Netlify config (caching headers)
```

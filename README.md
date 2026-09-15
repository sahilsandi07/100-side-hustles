# 100 Side Hustles — Product Site

A static product site with a Razorpay checkout and a protected PDF download.

**Customer flow:** `index.html` → `checkout.html` → Razorpay → `download.html` → protected PDF download

## Deploy on Vercel

1. Push this project to GitHub, GitLab, or Bitbucket (or import the folder with the Vercel CLI).
2. In [Vercel](https://vercel.com/new), import the repository and set the **Root Directory** to this project folder.
3. Select **Other** as the framework preset. There is no build command, install command, or output directory to configure.
4. Deploy. Vercel will serve the three HTML pages and create these server-side endpoints automatically:
   - `/api/verify-payment`
   - `/api/download`

`vercel.json` makes sure the PDF is bundled with the download function. The file is stored as `api/_ebook.pdf`; the leading underscore keeps it from becoming a public function route.

## Required Vercel environment variables

The Razorpay Payment Button redirects to this site with a `payment_id`. The Vercel function securely fetches that payment from Razorpay and unlocks the PDF only when the payment is captured for ₹499. Never put either value in HTML, JavaScript sent to visitors, or the repository.

1. In Razorpay, open **Settings → API Keys** and copy the **Key Secret** (not the Key ID).
2. In Vercel, open the project → **Settings → Environment Variables**.
3. Add these variables as **Secret** values:

   | Key | Value |
   | --- | --- |
   | `RAZORPAY_KEY_ID` | Your Razorpay Live API Key, beginning with `rzp_live_` |
   | `RAZORPAY_KEY_SECRET` | The matching Razorpay Live Key Secret |

4. Apply both to **Production** (and Preview if you will test preview deployments).
5. Redeploy after saving the variables.

The Key ID and Key Secret must be from the same Razorpay mode. Use the **Live** pair for the live payment button and the **Test** pair for a test button. If you change the price, also set `RAZORPAY_PAYMENT_AMOUNT` to the new price in paise (for example, `49900` for ₹499). Without that variable, the site expects ₹499.

## Configure Razorpay redirect

In Razorpay Dashboard, open the Payment Button with ID `pl_TboClL8loWEJkU` and set its successful-payment redirect URL to:

```
https://your-domain.vercel.app/download.html
```

Replace `your-domain.vercel.app` with your actual production domain. Razorpay appends the signed payment parameters that `download.html` passes to the Vercel endpoints for verification.

If you use a custom domain, set the redirect URL to that domain after it is connected and use it consistently in ads and links.

## How the download protection works

- `download.html` reads the Razorpay redirect parameters and asks `/api/verify-payment` to validate them on the server. Payment Links and standard Checkout use HMAC signatures; the Razorpay Payment Button used here sends a `payment_id`, which the function fetches from Razorpay using your server-only credentials.
- `/api/download` validates that same signature again before returning the PDF.
- The Razorpay secret exists only in Vercel environment variables. The PDF is bundled with the serverless function rather than linked from the public pages.

This verifies that a payment redirect is authentic. The signed redirect URL should still be treated as private: anyone who has a valid URL can use it while Razorpay considers its signature valid. For revocable, per-customer download access, add a database and Razorpay webhooks before issuing a short-lived download token.

## If a paid customer sees “Access Denied”

The page now shows the specific cause. The most common message is a **signature mismatch**. In that case:

1. Confirm `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are both configured.
2. Confirm they are from the same Razorpay mode as the button: **Test** button → Test credentials; **Live** button → Live credentials.
3. Confirm both variables are assigned to the Vercel **Production** environment for the live site.
4. Redeploy the Vercel project after any variable change.
5. Retry with the exact Razorpay redirect URL, or make a new test payment to confirm the full flow.

If the page says payment parameters are missing, set the Payment Button’s successful-payment redirect URL exactly to `https://your-domain.vercel.app/download.html` and complete the payment through that button.

## Update the price or payment button

The displayed price is currently **₹499**. Search for `EDITABLE PRICE` in `index.html` and `checkout.html`, then keep it aligned with the amount configured for the Razorpay Payment Button.

To use a different Razorpay button, replace `data-payment_button_id="pl_TboClL8loWEJkU"` in `checkout.html`. Update its redirect URL too.

## Before going live

- Add `RAZORPAY_KEY_SECRET` in Vercel and redeploy.
- Set Razorpay’s redirect URL to the production `download.html` URL.
- Run one real or Razorpay test-mode purchase end to end.
- Confirm a direct visit to `/download.html` shows **Access Denied**.
- Confirm `/api/download` without Razorpay query parameters returns a 403, not the PDF.
- Add your Meta Pixel to the `<head>` of `index.html` and `checkout.html` if you want conversion tracking.
- Keep marketing claims realistic; avoid promises of guaranteed income.

## Project structure

```
index.html               sales page
checkout.html            branded Razorpay checkout page
download.html            payment-verification and download page
assets/                  styles and public images
api/verify-payment.js    Vercel function that verifies the Razorpay signature
api/download.js          Vercel function that verifies again and sends the PDF
api/_ebook.pdf           protected ebook bundled with the download function
vercel.json              Vercel function configuration
```

// netlify/functions/verify-payment.js
//
// Verifies that the query params on this request were genuinely issued by
// Razorpay for a PAID payment — not just typed into the URL by a visitor.
//
// Razorpay Payment Links / Payment Buttons redirect successful buyers to
// your "Redirect URL after payment" with these query params attached:
//   razorpay_payment_id
//   razorpay_payment_link_id
//   razorpay_payment_link_reference_id   (may be blank if you didn't set one)
//   razorpay_payment_link_status         ("paid" on success)
//   razorpay_signature                   (HMAC-SHA256, signed with your key_secret)
//
// This function recomputes that signature server-side using RAZORPAY_KEY_SECRET
// (set in Netlify → Site settings → Environment variables — never put your
// secret in any HTML/JS file). Only an exact match proves the redirect is real.

const crypto = require('crypto');

function isValidSignature(q, secret) {
  const paymentId = q.razorpay_payment_id || '';
  const linkId = q.razorpay_payment_link_id || '';
  const refId = q.razorpay_payment_link_reference_id || '';
  const status = q.razorpay_payment_link_status || '';
  const signature = q.razorpay_signature || '';

  if (!secret || !paymentId || !linkId || !status || !signature) return false;
  if (status !== 'paid') return false;

  const payload = `${linkId}|${refId}|${status}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

exports.handler = async function (event) {
  const q = event.queryStringParameters || {};
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const valid = isValidSignature(q, secret);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ valid }),
  };
};

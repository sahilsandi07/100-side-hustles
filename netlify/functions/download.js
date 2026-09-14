// netlify/functions/download.js
//
// This is the ONLY place the ebook file lives. It is bundled inside this
// function (netlify/functions/ebook.pdf), not in the public site folder —
// so there is no static URL anyone can guess or bookmark to get the file
// directly. The PDF is only ever returned from here, and only after the
// exact same signature check used in verify-payment.js passes.
//
// Even if someone calls this function URL directly (skipping download.html
// entirely) without valid Razorpay query params, they get a 403, not the file.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

  if (!secret) {
    return { statusCode: 500, body: 'Server misconfigured: RAZORPAY_KEY_SECRET is not set.' };
  }

  if (!isValidSignature(q, secret)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'text/plain' },
      body: 'We could not verify a successful payment for this link. If you just paid, use the exact link Razorpay sent you after checkout.',
    };
  }

  const filePath = path.join(__dirname, 'ebook.pdf');
  const file = fs.readFileSync(filePath);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="100-Side-Hustles-to-Make-Money-Online.pdf"',
      'Cache-Control': 'no-store',
    },
    body: file.toString('base64'),
    isBase64Encoded: true,
  };
};

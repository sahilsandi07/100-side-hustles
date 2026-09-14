const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function isValidSignature(query, secret) {
  const paymentId = query.razorpay_payment_id || '';
  const linkId = query.razorpay_payment_link_id || '';
  const referenceId = query.razorpay_payment_link_reference_id || '';
  const status = query.razorpay_payment_link_status || '';
  const signature = query.razorpay_signature || '';

  if (!secret || !paymentId || !linkId || status !== 'paid' || !signature) return false;

  const payload = `${linkId}|${referenceId}|${status}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

module.exports = (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).send('Method not allowed.');
  }

  if (!isValidSignature(request.query || {}, process.env.RAZORPAY_KEY_SECRET)) {
    return response.status(403).type('text/plain').send(
      'We could not verify a successful payment for this link. If you just paid, use the exact link Razorpay sent you after checkout.'
    );
  }

  const ebookPath = path.join(__dirname, '_ebook.pdf');
  const ebook = fs.readFileSync(ebookPath);

  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', 'attachment; filename="100-Side-Hustles-to-Make-Money-Online.pdf"');
  return response.status(200).send(ebook);
};

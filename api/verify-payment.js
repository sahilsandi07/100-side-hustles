const crypto = require('crypto');

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
    return response.status(405).json({ valid: false });
  }

  const valid = isValidSignature(request.query || {}, process.env.RAZORPAY_KEY_SECRET);
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json({ valid });
};

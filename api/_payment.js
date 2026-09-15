const crypto = require('crypto');

function safeEqual(expected, signature) {
  if (!signature) return false;

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function getSignaturePayload(query) {
  const paymentId = query.razorpay_payment_id || '';

  if (query.razorpay_payment_link_id) {
    return {
      kind: 'payment_link',
      payload: [
        query.razorpay_payment_link_id,
        query.razorpay_payment_link_reference_id || '',
        query.razorpay_payment_link_status || '',
        paymentId,
      ].join('|'),
      paid: query.razorpay_payment_link_status === 'paid',
    };
  }

  if (query.razorpay_order_id) {
    return {
      kind: 'checkout',
      payload: `${query.razorpay_order_id}|${paymentId}`,
      paid: true,
    };
  }

  return null;
}

function verifyPayment(query, secret) {
  if (!secret || !secret.trim()) return { valid: false, reason: 'server_not_configured' };
  if (!query.razorpay_payment_id || !query.razorpay_signature) {
    return { valid: false, reason: 'missing_payment_parameters' };
  }

  const details = getSignaturePayload(query);
  if (!details) return { valid: false, reason: 'unsupported_payment_response' };
  if (!details.paid) return { valid: false, reason: 'payment_not_completed' };

  const expected = crypto.createHmac('sha256', secret.trim()).update(details.payload).digest('hex');
  if (!safeEqual(expected, query.razorpay_signature)) {
    return { valid: false, reason: 'signature_mismatch' };
  }

  return { valid: true, kind: details.kind };
}

module.exports = { verifyPayment };

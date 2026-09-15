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

function verifySignedPayment(query, secret) {
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

async function verifyPayment(query, environment, fetchImplementation = globalThis.fetch) {
  const secret = environment.RAZORPAY_KEY_SECRET;

  // Payment Links and standard Razorpay Checkout return a server-verifiable
  // HMAC signature. Keep supporting them when those parameters are present.
  if (query.razorpay_signature) {
    return verifySignedPayment(query, secret);
  }

  // Razorpay Payment Buttons redirect with payment_id only. Look up that ID
  // directly with Razorpay instead of trusting a browser redirect parameter.
  const paymentId = typeof query.payment_id === 'string' ? query.payment_id : '';
  const keyId = environment.RAZORPAY_KEY_ID;
  const expectedAmount = Number(environment.RAZORPAY_PAYMENT_AMOUNT || '49900');

  if (!paymentId) return { valid: false, reason: 'missing_payment_parameters' };
  if (!keyId || !keyId.trim() || !secret || !secret.trim()) {
    return { valid: false, reason: 'server_not_configured' };
  }
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId) || !Number.isInteger(expectedAmount) || expectedAmount < 1) {
    return { valid: false, reason: 'invalid_payment_response' };
  }

  try {
    const credentials = Buffer.from(`${keyId.trim()}:${secret.trim()}`).toString('base64');
    const razorpayResponse = await fetchImplementation(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
        },
      }
    );

    if (!razorpayResponse.ok) {
      if (razorpayResponse.status === 401 || razorpayResponse.status === 403) {
        return { valid: false, reason: 'razorpay_credentials_rejected' };
      }
      if (razorpayResponse.status === 404) {
        return { valid: false, reason: 'payment_not_found' };
      }
      return { valid: false, reason: 'payment_lookup_failed' };
    }

    const payment = await razorpayResponse.json();
    if (!payment || payment.id !== paymentId) {
      return { valid: false, reason: 'payment_not_found' };
    }
    if (payment.status !== 'captured' || payment.captured !== true) {
      return { valid: false, reason: 'payment_not_captured' };
    }
    if (payment.currency !== 'INR' || payment.amount !== expectedAmount) {
      return { valid: false, reason: 'payment_amount_mismatch' };
    }
    if (Number(payment.amount_refunded || 0) > 0) {
      return { valid: false, reason: 'payment_refunded' };
    }

    return { valid: true, kind: 'payment_button' };
  } catch (error) {
    return { valid: false, reason: 'payment_lookup_failed' };
  }
}

module.exports = { verifyPayment };

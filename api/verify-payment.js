const { verifyPayment } = require('./_payment');

module.exports = (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ valid: false });
  }

  const result = verifyPayment(request.query || {}, process.env.RAZORPAY_KEY_SECRET);
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json(result);
};

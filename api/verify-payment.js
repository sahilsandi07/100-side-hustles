const { verifyPayment } = require('./_payment');

module.exports = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ valid: false });
  }

  const result = await verifyPayment(request.query || {}, process.env);
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json(result);
};

const fs = require('fs');
const path = require('path');
const { verifyPayment } = require('./_payment');

module.exports = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).send('Method not allowed.');
  }

  const verification = await verifyPayment(request.query || {}, process.env);
  if (!verification.valid) {
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

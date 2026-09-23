// Human-readable order number, e.g. CB-20260922-00417
const generateOrderNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(10000 + Math.random() * 89999);
  return `CB-${datePart}-${randomPart}`;
};

module.exports = generateOrderNumber;

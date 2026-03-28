/**
 * Helper to convert BigInt to string for JSON serialization
 * MariaDB returns BigInt for numeric/INT fields
 */
function convertBigInt(obj) {
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, convertBigInt(v)])
    );
  }
  return obj;
}

module.exports = convertBigInt;

/**
 * @module cosineSimilarity
 * @description Cosine similarity calculation for face recognition.
 * Used by: face.localModel for comparing embeddings
 * 
 * Formula: similarity = (A · B) / (||A|| * ||B||)
 * Range: -1 (opposite) to 1 (identical)
 * 
 * Usage in face recognition:
 * - 0.95+: Probationary employee match
 * - 0.84+: Default employee match
 * - 0.80+: Trusted employee match
 * - <0.80: Possible mismatch, escalate to cloud
 */

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vec1 - First vector (typically stored embedding)
 * @param {Array<number>} vec2 - Second vector (typically check-in embedding)
 * @returns {number} Cosine similarity (-1 to 1)
 */
const cosineSimilarity = (vec1, vec2) => {
  // Validate inputs
  if (!vec1 || !vec2) {
    return 0;
  }

  if (!Array.isArray(vec1) || !Array.isArray(vec2)) {
    return 0;
  }

  if (vec1.length !== vec2.length) {
    return 0;
  }

  // Empty vectors
  if (vec1.length === 0) {
    return 0;
  }

  // Calculate dot product and norms
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    const a = vec1[i] || 0;
    const b = vec2[i] || 0;

    dotProduct += a * b;
    norm1 += a * a;
    norm2 += b * b;
  }

  // Handle zero norms (one or both vectors are zero vectors)
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  // Calculate and return cosine similarity
  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

  // Clamp to [-1, 1] range (in case of floating point errors)
  return Math.max(-1, Math.min(1, similarity));
};

module.exports = cosineSimilarity;

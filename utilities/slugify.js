
/**
 * En funktion jag tagit från internet som gör att en sträng med otillåtna tecken ändras så att den kan vara i en url.
 * @param {string} text - det som ska slugifieras.
 * @returns 
 */
function slugify(text) {
  return text
    .toString()                           // Ensure it's a string
    .normalize("NFD")                     // Normalize Unicode (decompose accents)
    .replace(/[\u0300-\u036f]/g, "")      // Remove diacritics
    .toLowerCase()                        // Convert to lowercase
    .trim()                               // Trim leading/trailing spaces
    .replace(/[^a-z0-9\s-]/g, "")         // Remove non-alphanumeric characters
    .replace(/\s+/g, "-")                 // Replace spaces with hyphens
    .replace(/-+/g, "-");                 // Collapse multiple hyphens
}

module.exports = { slugify };
// Build-time switch for restoring the saved commerce screens later.
// Listings is deliberately the safe default for the current public product.
export const isDirectListingsMode = process.env.NEXT_PUBLIC_MARKETPLACE_MODE !== "Commerce";

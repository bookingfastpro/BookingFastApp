/**
 * Calcule le prix HT à partir du prix TTC et du taux de TVA
 * @param priceTTC - Prix TTC (toutes taxes comprises)
 * @param taxRate - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Prix HT (hors taxes)
 */
export function calculatePriceHT(priceTTC: number, taxRate: number): number {
  if (taxRate === 0) return priceTTC;
  return priceTTC / (1 + taxRate / 100);
}

/**
 * Calcule le prix TTC à partir du prix HT et du taux de TVA
 * @param priceHT - Prix HT (hors taxes)
 * @param taxRate - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Prix TTC (toutes taxes comprises)
 */
export function calculatePriceTTC(priceHT: number, taxRate: number): number {
  return priceHT * (1 + taxRate / 100);
}

/**
 * Calcule le montant de la TVA
 * @param priceTTC - Prix TTC (toutes taxes comprises)
 * @param taxRate - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Montant de la TVA
 */
export function calculateTaxAmount(priceTTC: number, taxRate: number): number {
  const priceHT = calculatePriceHT(priceTTC, taxRate);
  return priceTTC - priceHT;
}

/**
 * Formate un prix pour l'affichage
 * @param price - Prix à formater
 * @param decimals - Nombre de décimales (par défaut 2)
 * @returns Prix formaté avec le symbole €
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return `${price.toFixed(decimals)}€`;
}

/**
 * Formate un taux de TVA pour l'affichage
 * @param taxRate - Taux de TVA en pourcentage
 * @returns Taux formaté avec le symbole %
 */
export function formatTaxRate(taxRate: number): string {
  return `${taxRate}%`;
}

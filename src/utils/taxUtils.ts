export function calculateTTC(priceHT: number, taxRate: number): number {
  return Number((priceHT * (1 + taxRate / 100)).toFixed(2));
}

export function calculateHT(priceTTC: number, taxRate: number): number {
  return Number((priceTTC / (1 + taxRate / 100)).toFixed(2));
}

export function calculateTaxAmount(priceHT: number, taxRate: number): number {
  return Number((priceHT * (taxRate / 100)).toFixed(2));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

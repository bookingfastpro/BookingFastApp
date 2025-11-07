/**
 * Bibliothèque centralisée pour les calculs d'acompte
 */

export interface DepositCalculationParams {
  totalAmount: number;
  depositPercentage: number;
  depositFixedAmount: number;
  depositType: 'percentage' | 'fixed_amount';
  quantity: number;
  multiplyByUnits: boolean;
}

/**
 * Calcule le montant de l'acompte selon les paramètres configurés
 * 
 * @param params - Paramètres de calcul
 * @returns Montant de l'acompte calculé
 * 
 * @example
 * // Mode pourcentage avec multiplication par unités
 * calculateDepositAmount({
 *   totalAmount: 300, // 3 × 100€
 *   depositPercentage: 30,
 *   depositFixedAmount: 0,
 *   depositType: 'percentage',
 *   quantity: 3,
 *   multiplyByUnits: true
 * }) // Retourne 90 (3 × 30% × 100€)
 * 
 * @example
 * // Mode pourcentage sans multiplication par unités
 * calculateDepositAmount({
 *   totalAmount: 300, // 3 × 100€
 *   depositPercentage: 30,
 *   depositFixedAmount: 0,
 *   depositType: 'percentage',
 *   quantity: 3,
 *   multiplyByUnits: false
 * }) // Retourne 30 (30% × 100€)
 */
export function calculateDepositAmount(params: DepositCalculationParams): number {
  const {
    totalAmount,
    depositPercentage,
    depositFixedAmount,
    depositType,
    quantity,
    multiplyByUnits
  } = params;

  // Validation des paramètres
  if (totalAmount < 0 || quantity <= 0) {
    return 0;
  }

  // Calcul selon le type d'acompte
  if (depositType === 'fixed_amount') {
    // Montant fixe
    if (multiplyByUnits) {
      // Multiplier le montant fixe par le nombre d'unités
      return depositFixedAmount * quantity;
    } else {
      // Montant fixe unique, peu importe le nombre d'unités
      return depositFixedAmount;
    }
  } else {
    // Pourcentage
    if (multiplyByUnits) {
      // Appliquer le pourcentage sur le montant total (qui inclut déjà la quantité)
      return (totalAmount * depositPercentage) / 100;
    } else {
      // Appliquer le pourcentage sur le prix unitaire uniquement
      const unitPrice = totalAmount / quantity;
      return (unitPrice * depositPercentage) / 100;
    }
  }
}

/**
 * Calcule le montant restant à payer après l'acompte
 */
export function calculateRemainingAmount(totalAmount: number, depositAmount: number): number {
  return Math.max(0, totalAmount - depositAmount);
}

/**
 * Calcule le pourcentage d'acompte effectif par rapport au total
 */
export function calculateEffectiveDepositPercentage(totalAmount: number, depositAmount: number): number {
  if (totalAmount === 0) return 0;
  return (depositAmount / totalAmount) * 100;
}

export interface UnitComparison {
  baseAmount: number;
  baseUnit: string;
  pricePerBaseUnit: number;
}

export function calculatePerformance(
  price: number,
  quantityAmount: number | null,
  unit: string | null,
  packageSize: number | null
): UnitComparison | null {
  if (!quantityAmount || !unit || !price) return null;

  const totalQuantity = quantityAmount * (packageSize || 1);
  const lowerUnit = unit.toLowerCase();

  let baseAmount = totalQuantity;
  let baseUnit = lowerUnit;

  // Convert volumes to Liters
  if (['ml', 'mililitro', 'mililitros'].includes(lowerUnit)) {
    baseAmount = totalQuantity / 1000;
    baseUnit = 'L';
  } else if (['l', 'litro', 'litros'].includes(lowerUnit)) {
    baseUnit = 'L';
  } else if (['oz', 'onza', 'onzas'].includes(lowerUnit)) {
    // Liquid ounces
    baseAmount = totalQuantity * 0.0295735;
    baseUnit = 'L';
  }

  // Convert weights to Kilograms
  else if (['g', 'gr', 'gramo', 'gramos'].includes(lowerUnit)) {
    baseAmount = totalQuantity / 1000;
    baseUnit = 'Kg';
  } else if (['kg', 'kilo', 'kilos', 'kilogramo'].includes(lowerUnit)) {
    baseUnit = 'Kg';
  } else if (['lb', 'libra', 'libras'].includes(lowerUnit)) {
    baseAmount = totalQuantity * 0.453592;
    baseUnit = 'Kg';
  }

  // Pieces
  else if (['pza', 'pzas', 'pieza', 'piezas'].includes(lowerUnit)) {
    baseUnit = 'Pieza';
  }

  const pricePerBaseUnit = price / baseAmount;

  return {
    baseAmount,
    baseUnit,
    pricePerBaseUnit
  };
}

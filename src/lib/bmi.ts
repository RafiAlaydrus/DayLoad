/** Body mass index (kg / m^2), rounded to one decimal. */
export function bmi(weightKg: number, heightCm: number): number {
  const meters = heightCm / 100
  return Math.round((weightKg / (meters * meters)) * 10) / 10
}

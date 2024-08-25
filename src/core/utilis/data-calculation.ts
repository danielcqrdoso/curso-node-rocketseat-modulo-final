export function calculateDaysPassed(
  startDateParam: string | Date,
  finalDateParam?: string | Date,
): number {
  const startDate = new Date(startDateParam)
  const finalDate = finalDateParam ? new Date(finalDateParam) : new Date()

  const differenceInTime = finalDate.getTime() - startDate.getTime()

  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24))

  return differenceInDays
}

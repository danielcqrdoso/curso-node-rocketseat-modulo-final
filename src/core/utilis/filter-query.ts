export function createFilterRaw(filters: string[]): string {
  return filters
    .filter((filter) => filter !== 'nothing')
    .map((filter) => `(${filter})`)
    .join(' AND ')
}

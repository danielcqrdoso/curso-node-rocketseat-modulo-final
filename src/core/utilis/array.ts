export function removeItemFromArrayByObject<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}

export function removeItemFromArrayByID<T extends { id: unknown }, U>(
  array: T[],
  id: U,
) {
  // eslint-disable-next-line eqeqeq
  const indexToRemove = array.findIndex((item) => item.id == id)

  if (indexToRemove !== -1) {
    array.splice(indexToRemove, 1)
  }
}

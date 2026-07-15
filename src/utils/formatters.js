export function formatDate(dateString) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('ko-KR')
}

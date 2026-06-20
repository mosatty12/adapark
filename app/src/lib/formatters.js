export const formatTL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(n)

export const formatTLShort = (n) => {
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(1)}k`
  return `₺${n.toFixed(0)}`
}

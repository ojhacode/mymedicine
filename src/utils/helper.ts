export const toNepaliDigits = (value: string | number): string => {
  const nep = ['०','१','२','३','४','५','६','७','८','९']
  const str = value.toString() // Ensure we can handle numbers and strings
  return str.split('').map(ch => (/\d/.test(ch) ? nep[parseInt(ch)] : ch)) /*Convert only digits */.join('')
}

export const toMillis = (ts: any) =>
  typeof ts === "number"
    ? ts
    : ts?.seconds
    ? ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1_000_000)
    : Date.now()

export const toArray = (val: any) => {
  if (!val) return []
  if (typeof val === "string") {
    try {
      return JSON.parse(val)
    } catch {
      return []
    }
  }
  return val
}

export const withAlpha = (rgb: string, alpha: number) =>
  rgb.startsWith('rgb(') ? rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`) : rgb
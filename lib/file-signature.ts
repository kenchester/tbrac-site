/** Check that a file's bytes match its declared type before it is parsed or sent anywhere. */
export function matchesType(bytes: Uint8Array, mime: string): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b)
  switch (mime) {
    case "application/pdf": return starts(0x25, 0x50, 0x44, 0x46) // %PDF
    case "image/png": return starts(0x89, 0x50, 0x4e, 0x47)
    case "image/jpeg": return starts(0xff, 0xd8, 0xff)
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return starts(0x50, 0x4b, 0x03, 0x04) // zip
    default: return false
  }
}

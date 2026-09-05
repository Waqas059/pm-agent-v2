const LEGACY_WORD_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

export function isLegacyWordContainer(bytes: Uint8Array) {
  return bytes.length >= LEGACY_WORD_HEADER.length
    && LEGACY_WORD_HEADER.every((byte, index) => bytes[index] === byte);
}

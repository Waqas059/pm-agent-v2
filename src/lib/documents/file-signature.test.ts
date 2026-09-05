import { describe, expect, it } from "vitest";

import { isLegacyWordContainer } from "./file-signature";

describe("document file signatures", () => {
  it("recognizes a legacy Word compound-file header", () => {
    expect(isLegacyWordContainer(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe(true);
  });

  it("does not classify an OOXML zip header as legacy Word", () => {
    expect(isLegacyWordContainer(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(false);
  });
});

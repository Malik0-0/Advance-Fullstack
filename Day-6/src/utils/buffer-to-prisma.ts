export function bufferToPrismaUint8(buf: Buffer): Uint8Array<ArrayBuffer> {
    const view = Uint8Array.from(buf);
    return view as unknown as Uint8Array<ArrayBuffer>;
  }
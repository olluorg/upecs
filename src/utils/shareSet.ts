import LZString from "lz-string";

export type SharePayload = { n: string; c: string[] };

export function encodeShare(name: string, cardIds: string[]): string {
  const builtIn = cardIds.filter((id) => !id.startsWith("custom_"));
  return LZString.compressToEncodedURIComponent(`${name}|${builtIn.join(",")}`);
}

export function decodeShare(param: string): SharePayload | null {
  try {
    const payload = LZString.decompressFromEncodedURIComponent(param) ?? "";
    const sep = payload.indexOf("|");
    if (sep < 0) return null;
    return {
      n: payload.slice(0, sep),
      c: payload.slice(sep + 1).split(",").filter(Boolean),
    };
  } catch {
    return null;
  }
}

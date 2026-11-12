type DetailKind = "farm" | "product";

export function publicDetailPath(kind: DetailKind, code: string, name?: string) {
  const normalized = (name ?? "").normalize("NFKC").replace(/ي/g, "ی").replace(/ك/g, "ک");
  const slug = Array.from(normalized.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+/, ""))
    .slice(0, 72).join("").replace(/-+$/, "");
  return `/${kind}/${encodeURIComponent(slug ? `${slug}--${code}` : code)}`;
}

export function publicDetailCode(segment: string) {
  const separator = segment.lastIndexOf("--");
  const code = separator === -1 ? segment : segment.slice(separator + 2);
  return /^[a-z0-9]{1,10}$/i.test(code) ? code : null;
}

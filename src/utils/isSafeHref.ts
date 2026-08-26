// Allowlist-based URL scheme guard.
//
// Untrusted values (e.g. the `discussions` / `snapshot` fields from IPFS proposal
// metadata) are rendered directly into anchor `href`s. Without this guard a value
// like `javascript:alert(document.cookie)` produces a clickable one-click XSS.
//
// We only allow http(s) and mailto schemes; relative paths and #anchors (which have
// no scheme) are allowed too. Everything else (javascript:, data:, vbscript:, file:, ...)
// is treated as unsafe.

const SAFE_SCHEMES = ['http:', 'https:', 'mailto:'];

export function isSafeHref(href?: string): boolean {
  if (!href) return true; // empty / undefined is harmless

  // Drop ASCII control chars (<= 0x20, incl. space/tab/newline) and DEL (0x7F).
  // Browsers strip these when parsing a URL, so attackers use them to obfuscate the
  // scheme, e.g. "java<TAB>script:" or "  javascript:". We strip them before checking.
  let stripped = '';
  for (const ch of href) {
    const code = ch.charCodeAt(0);
    if (code > 0x20 && code !== 0x7f) stripped += ch;
  }
  stripped = stripped.toLowerCase();

  const schemeMatch = stripped.match(/^([a-z][a-z0-9+.-]*:)/);
  if (!schemeMatch) return true; // no scheme -> relative / hash path

  return SAFE_SCHEMES.includes(schemeMatch[1]);
}

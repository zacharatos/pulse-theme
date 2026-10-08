// Parser for the small YAML subset themes/pulse.yaml is generated in: nested maps by indentation,
// "quoted" scalar values and # comments. Shared by scripts/contrast.mjs (Node) and test/preview.html (browser).
// Anything else in the file is an error, so a hand edit that breaks the format fails loudly.
export function parseThemes(text) {
  const root = {};
  const stack = [{ indent: -1, node: root }];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#")) return;
    const indent = line.length - line.trimStart().length;
    const m = line.trim().match(/^([A-Za-z0-9_ .-]+):(?:\s+"((?:[^"\\]|\\.)*)")?$/);
    if (!m) throw new Error(`pulse.yaml line ${i + 1}: unsupported syntax: ${line.trim()}`);
    while (stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).node;
    if (m[2] !== undefined) parent[m[1]] = m[2].replace(/\\"/g, '"');
    else { parent[m[1]] = {}; stack.push({ indent, node: parent[m[1]] }); }
  });
  return root;
}


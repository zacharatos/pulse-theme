// Fails when the version in package.json has no CHANGELOG.md section, or (with a tag argument, vX.Y.Z)
// when the tag disagrees with package.json. Run by the release workflow; handy locally too:
// `node scripts/check-version.mjs v1.4.0`.
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json")).version;
const problems = [];
const tag = process.argv[2];
if (tag && tag.replace(/^v/, "") !== pkg) problems.push(`tag ${tag} disagrees with package.json (${pkg})`);
if (!new RegExp(`^## \\[${pkg.replace(/\./g, "\\.")}\\]`, "m").test(read("CHANGELOG.md"))) problems.push(`CHANGELOG.md has no "## [${pkg}]" section`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Version ${pkg} agrees${tag ? ` with tag ${tag}` : ""} and has a CHANGELOG.md section.`);

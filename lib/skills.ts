/**
 * People paste skills from a CV, a LinkedIn profile, or just type them out.
 * Accept commas, newlines, bullets, pipes and semicolons — anything that reads
 * as a list separator — while leaving multi-word skills ("Design systems") and
 * slashed ones ("CI/CD") intact.
 */
export function parseSkills(input: string, max = 12): string[] {
  return input
    .split(/[,;|\n\r\t•·]+|\s{2,}/)
    .map((s) => s.replace(/^[-–—*·\s]+/, "").replace(/[-–—*·\s]+$/, "").trim())
    .filter(Boolean)
    .filter((s) => s.length <= 40)
    .filter((s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)
    .slice(0, max);
}

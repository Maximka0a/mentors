import fs from "node:fs";
import path from "node:path";

interface ParsedQuestion {
  question: string;
  answer: string;
}

interface ParsedCategory {
  name: string;
  declaredCount: number;
  questions: ParsedQuestion[];
}

const TOP_LEVEL_RE = /^(.+):\s*Вопросы на собесе\s*\((\d+)\)$/u;
// Requires a space before "(N)" so code like "delay(1000)" doesn't match, and caps N
// so large numeric literals in code snippets (e.g. Thread.sleep(999)) are rejected.
const HEADER_RE = /^(.+?)\s+\((\d{1,3})\)$/u;

function parse(lines: string[]): ParsedCategory[] {
  const categories: ParsedCategory[] = [];
  let topLevelName: string | null = null;
  let currentCategory: ParsedCategory | null = null;
  let currentQuestion: ParsedQuestion | null = null;

  const flushQuestion = () => {
    if (currentQuestion && currentCategory) {
      currentQuestion.answer = currentQuestion.answer.trim();
      currentCategory.questions.push(currentQuestion);
    }
    currentQuestion = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^Вопросы с собесов\s*\(\d+\)$/u.test(line)) continue; // doc title

    const topMatch = line.match(TOP_LEVEL_RE);
    if (topMatch) {
      flushQuestion();
      topLevelName = topMatch[1].trim();
      // Start a flat category right away in case this category has no subcategory
      // groupings and questions appear directly under the top-level header.
      currentCategory = { name: topLevelName, declaredCount: Number(topMatch[2]), questions: [] };
      categories.push(currentCategory);
      continue;
    }

    const headerMatch = !line.endsWith("?") ? line.match(HEADER_RE) : null;
    if (headerMatch) {
      flushQuestion();
      const subName = headerMatch[1].trim();
      const name = topLevelName ? `${topLevelName} > ${subName}` : subName;
      currentCategory = { name, declaredCount: Number(headerMatch[2]), questions: [] };
      categories.push(currentCategory);
      continue;
    }

    if (line.endsWith("?")) {
      flushQuestion();
      currentQuestion = { question: line, answer: "" };
      continue;
    }

    if (currentQuestion) {
      currentQuestion.answer += (currentQuestion.answer ? "\n" : "") + line;
    }
  }
  flushQuestion();

  return categories;
}

function main() {
  const inputPath = process.argv[2] ?? path.join(process.cwd(), "123.txt");
  const outputPath = path.join(process.cwd(), "prisma", "seed-data.json");

  const raw = fs.readFileSync(inputPath, "utf-8");
  const lines = raw.split(/\r?\n/);
  const categories = parse(lines);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2), "utf-8");

  console.log(`Parsed ${categories.length} categories from ${inputPath}\n`);
  console.log("name".padEnd(50), "declared", "parsed", "match?");
  let totalDeclared = 0;
  let totalParsed = 0;
  for (const c of categories) {
    totalDeclared += c.declaredCount;
    totalParsed += c.questions.length;
    const mark = c.declaredCount === c.questions.length ? "OK" : "MISMATCH";
    console.log(c.name.padEnd(50), String(c.declaredCount).padEnd(8), String(c.questions.length).padEnd(6), mark);
  }
  console.log(`\nTotal declared: ${totalDeclared}, total parsed: ${totalParsed}`);
  console.log(`Wrote ${outputPath}`);
}

main();

import * as fs from "node:fs";
import * as readline from "node:readline";

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: npx tsx src/scripts/diagnose-rarity.ts <path-to-output.jsonl>");
    process.exit(1);
}

type RarityMap = {
    frequency?: number;
    hasFrequency?: boolean;
    tags?: number;
    tagsCount?: number;
    categories?: number;
    categoriesCount?: number;
    conjugation?: number;
    polysemous?: number;
    pos?: number;
    derived?: number;
    tier3?: number;
    length?: number;
    clamping?: number;
};

type WordRow = {
    word: string;
    rarity: number;
    rarityMap: RarityMap;
    partOfSpeech?: string[];
    tags?: string[];
};

const words: WordRow[] = [];

const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
for await (const line of rl) {
    if (line.trim() === "") continue;
    try {
        words.push(JSON.parse(line) as WordRow);
    } catch {
        // skip malformed lines
    }
}

const total = words.length;
if (total === 0) {
    console.error("No words found in file.");
    process.exit(1);
}

// --- 1. Distribution by bucket of 10 ---
console.log(`\n=== DISTRIBUZIONE PER BUCKET (totale: ${total} parole) ===`);
const buckets = Array.from({ length: 11 }, () => 0);
for (const w of words) {
    const idx = Math.min(Math.floor(w.rarity / 10), 10);
    buckets[idx]++;
}
for (let i = 0; i < 11; i++) {
    const lo = i * 10;
    const hi = i === 10 ? 100 : lo + 9;
    const count = buckets[i];
    const pct = ((count / total) * 100).toFixed(1);
    const bar = "█".repeat(Math.round((count / total) * 40));
    console.log(`[${String(lo).padStart(2)}-${String(hi).padStart(3)}]: ${String(count).padStart(5)} (${pct.padStart(5)}%)  ${bar}`);
}

// --- 2. Top 20 highest rarity ---
const sorted = [...words].sort((a, b) => b.rarity - a.rarity);
const fmt = (w: WordRow) =>
    `${w.word.padEnd(30)} | ${String(w.rarity).padStart(3)} | ${(w.partOfSpeech ?? []).join(",").slice(0, 14).padEnd(14)} | tags:${(w.tags ?? []).join(",").slice(0, 20).padEnd(20)} | freq:${String(w.rarityMap?.frequency ?? "?").padStart(4)} hasFq:${w.rarityMap?.hasFrequency ? "Y" : "N"} tagScore:${String(w.rarityMap?.tags ?? "?").padStart(4)} pos:${String(w.rarityMap?.pos ?? "?").padStart(4)} t3:${String(w.rarityMap?.tier3 ?? "?").padStart(4)}`;

console.log("\n=== TOP 20 RARITY PIÙ ALTA ===");
sorted.slice(0, 20).forEach((w) => console.log(fmt(w)));

console.log("\n=== TOP 20 RARITY PIÙ BASSA ===");
sorted.slice(-20).reverse().forEach((w) => console.log(fmt(w)));

// --- 3. Frequency coverage ---
const withFreq = words.filter((w) => w.rarityMap?.hasFrequency === true).length;
console.log(`\n=== COPERTURA FREQUENZA ===`);
console.log(`Con frequenza:    ${withFreq} / ${total} (${((withFreq / total) * 100).toFixed(1)}%)`);
console.log(`Senza frequenza:  ${total - withFreq} / ${total} (${(((total - withFreq) / total) * 100).toFixed(1)}%)`);

// --- 4. Mean and median ---
const scores = words.map((w) => w.rarity).sort((a, b) => a - b);
const mean = scores.reduce((s, v) => s + v, 0) / total;
const median = total % 2 === 0
    ? (scores[total / 2 - 1] + scores[total / 2]) / 2
    : scores[Math.floor(total / 2)];
const p25 = scores[Math.floor(total * 0.25)];
const p75 = scores[Math.floor(total * 0.75)];

console.log(`\n=== STATISTICHE SCORE ===`);
console.log(`Media:    ${mean.toFixed(1)}`);
console.log(`Mediana:  ${median}`);
console.log(`P25:      ${p25}  (il 25% delle parole ha score ≤ questo)`);
console.log(`P75:      ${p75}  (il 75% delle parole ha score ≤ questo)`);
console.log(`Min:      ${scores[0]}`);
console.log(`Max:      ${scores[total - 1]}`);

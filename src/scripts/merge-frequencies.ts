// Merges multiple frequency files into a single normalized file.
//
// Usage:
//   npx tsx src/scripts/merge-frequencies.ts --out merged.txt --raw opensubtitles.txt crusca.txt --norm wordfreq_it.txt
//
// --raw  : files with raw token counts (auto-normalized to fpm)
// --norm : files already in freq/million (used as-is)
// --out  : output file path (default: merged.txt)

import * as fs from "node:fs";
import * as path from "node:path";

function parseArgs(): {
    rawFiles: string[];
    normFiles: string[];
    outFile: string;
} {
    const args = process.argv.slice(2);
    const rawFiles: string[] = [];
    const normFiles: string[] = [];
    let outFile = "merged.txt";
    let i = 0;

    while (i < args.length) {
        const arg = args[i];
        if (arg === "--out") {
            outFile = args[++i];
        } else if (arg === "--raw") {
            i++;
            while (i < args.length && !args[i].startsWith("--")) {
                rawFiles.push(args[i++]);
            }
            continue;
        } else if (arg === "--norm") {
            i++;
            while (i < args.length && !args[i].startsWith("--")) {
                normFiles.push(args[i++]);
            }
            continue;
        }
        i++;
    }

    return { rawFiles, normFiles, outFile };
}

function readWordValues(filePath: string): Map<string, number> {
    const map = new Map<string, number>();
    const content = fs.readFileSync(filePath, "utf-8");

    for (const line of content.split(/\r?\n/)) {
        if (line.trim() === "") continue;
        const sepIdx = line.indexOf("\t");
        const [word, valueStr] = line.split(sepIdx >= 0 ? "\t" : " ", 2);
        const value = parseFloat(valueStr);
        if (word && !isNaN(value) && value > 0) {
            map.set(word, value);
        }
    }

    return map;
}

function normalizeToFpm(rawMap: Map<string, number>): Map<string, number> {
    let total = 0;
    for (const v of rawMap.values()) total += v;
    const fpmMap = new Map<string, number>();
    const divisor = total / 1_000_000;
    for (const [word, count] of rawMap) {
        fpmMap.set(word, count / divisor);
    }
    return fpmMap;
}

function main() {
    const { rawFiles, normFiles, outFile } = parseArgs();

    if (rawFiles.length === 0 && normFiles.length === 0) {
        console.error("Error: no input files. Use --raw and/or --norm.");
        process.exit(1);
    }

    // word → max fpm across all sources
    const combined = new Map<string, number>();

    const updateMax = (fpmMap: Map<string, number>) => {
        for (const [word, fpm] of fpmMap) {
            const current = combined.get(word) ?? 0;
            if (fpm > current) combined.set(word, fpm);
        }
    };

    for (const file of rawFiles) {
        console.log(`Reading raw: ${path.basename(file)}`);
        const raw = readWordValues(file);
        const fpm = normalizeToFpm(raw);
        console.log(`  ${raw.size} words, total tokens: ${[...raw.values()].reduce((a, b) => a + b, 0).toLocaleString()}`);
        updateMax(fpm);
    }

    for (const file of normFiles) {
        console.log(`Reading norm: ${path.basename(file)}`);
        const fpm = readWordValues(file);
        console.log(`  ${fpm.size} words`);
        updateMax(fpm);
    }

    // Sort by fpm descending
    const sorted = [...combined.entries()].sort((a, b) => b[1] - a[1]);

    // Write output: "word rounded_fpm" with minimum 1
    const lines = sorted.map(([word, fpm]) => `${word} ${Math.max(1, Math.round(fpm))}`);
    fs.writeFileSync(outFile, lines.join("\n") + "\n", "utf-8");

    console.log(`\nOutput: ${outFile}`);
    console.log(`Total unique words: ${sorted.length.toLocaleString()}`);

    // Coverage per source
    console.log("\nCoverage per source:");
    for (const file of rawFiles) {
        const raw = readWordValues(file);
        const covered = [...raw.keys()].filter((w) => combined.has(w)).length;
        console.log(`  ${path.basename(file)}: ${raw.size.toLocaleString()} words`);
        void covered;
    }
    for (const file of normFiles) {
        const fpm = readWordValues(file);
        console.log(`  ${path.basename(file)}: ${fpm.size.toLocaleString()} words`);
    }

    // Top 10
    console.log("\nTop 10 words by fpm:");
    for (const [word, fpm] of sorted.slice(0, 10)) {
        console.log(`  ${word.padEnd(20)} ${fpm.toFixed(2)}`);
    }
}

main();

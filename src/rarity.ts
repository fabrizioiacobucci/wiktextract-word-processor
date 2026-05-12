import * as fs from "node:fs";
import { LanguageCode, WiktextractEntry } from "./types.ts";
import {
    CalculateRarityOptions,
    DEFAULT_RARITY_CALCULATION_OPTIONS,
    POS_RARITY_MODIFIER,
    RARITY_TAG_SCORES,
    TECHNICAL_CATEGORIES,
} from "./rarity.types.ts";

export function getFrequencyRarityAdjustment(rank: number | undefined): number {
    if (rank === undefined) {
        return 5;
    }

    if (rank <= 500) {
        return -20;
    }
    if (rank <= 2000) {
        return -12;
    }
    if (rank <= 5000) {
        return -8;
    }
    if (rank <= 10000) {
        return -5;
    }
    if (rank <= 20000) {
        return 0;
    }
    if (rank <= 50000) {
        return 2;
    }

    return 5;
}

export function loadFrequencyData(filePath: string): Map<string, number> {
    const frequencyRanks = new Map<string, number>();
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const lines = fileContents.split(/\r?\n/);

    let rank = 0;
    for (const line of lines) {
        if (line.trim() === "") {
            continue;
        }

        // FrequencyWords format: "word count" (space-separated) or "word\tcount" (tab-separated)
        const separatorIndex = line.indexOf("\t");
        const word = (
            separatorIndex >= 0
                ? line.slice(0, separatorIndex)
                : line.slice(0, line.lastIndexOf(" "))
        ).trim();

        if (word === "") {
            continue;
        }

        rank += 1;
        frequencyRanks.set(word, rank);
    }

    return frequencyRanks;
}

export function calculateRarityTag(
    senses: WiktextractEntry["senses"],
    rarityTagScores: Record<string, number>,
    tags: string[],
): number {
    const sensesCount = senses?.length || 0;
    let score = 0;
    const senseTagCounts = new Map<string, number>();

    for (const sense of senses || []) {
        const seen = new Set<string>();
        for (const tag of sense.tags || []) {
            if (tag in rarityTagScores && !seen.has(tag)) {
                seen.add(tag);
                senseTagCounts.set(tag, (senseTagCounts.get(tag) || 0) + 1);
            }
        }
    }

    for (const [tag, count] of senseTagCounts) {
        const proportion = count / sensesCount;
        score += Math.round(rarityTagScores[tag] * proportion);
    }

    // Entry-level rarity tags not present in any sense:
    // count as if 1 sense had them (minimum proportional contribution)
    for (const tag of tags || []) {
        if (tag in rarityTagScores && !senseTagCounts.has(tag)) {
            score += Math.round(rarityTagScores[tag] / sensesCount);
        }
    }

    return score;
}

export function calculateTechnicalCategory(
    senses: WiktextractEntry["senses"],
    categories: string[],
    lang: LanguageCode,
): number {
    const technicalCategories = TECHNICAL_CATEGORIES[lang] || [];
    let score = 0;

    if (technicalCategories.length === 0) {
        return score; // No technical category data for this language
    }

    // Check sense-level topics
    let hasTechnicalTopic = false;
    for (const sense of senses || []) {
        const topics = sense.categories || [];
        if (
            topics.some((t) =>
                technicalCategories.some((tech) =>
                    t.toLowerCase().startsWith(tech),
                ),
            )
        ) {
            hasTechnicalTopic = true;
            break;
        }
    }

    let hasTechnicalCategory = false;
    // Check entry-level categories
    for (const cat of categories) {
        const catLower = cat.toLowerCase();
        if (technicalCategories.some((tech) => catLower.startsWith(tech))) {
            hasTechnicalCategory = true;
            break;
        }
    }

    if (hasTechnicalTopic && hasTechnicalCategory) {
        score += 20;
    }

    if (hasTechnicalTopic && !hasTechnicalCategory) {
        score += 15;
    }

    if (!hasTechnicalTopic && hasTechnicalCategory) {
        score += 12;
    }

    return score;
}

export function calculateVerbConjugation(
    pos: string,
    formsCount: number,
): number {
    if (pos === "verb") {
        if (formsCount > 50) {
            return -8; // Complete conjugation = common but not always
        }
    }
    return 0;
}

export function calculatePolysemous(
    pos: string,
    sensesCount: number,
    derivedCount: number,
): number {
    if (pos !== "noun" && pos !== "adj") {
        return 0; // Polysemy is a stronger rarity signal for nouns and adjectives
    }

    if (sensesCount >= 4 && derivedCount >= 3) {
        return -8; // Highly polysemous + productive words are usually common
    }

    return 0;
}

export function calculateDerivedCount(derivedCount: number): number {
    if (derivedCount > 10) {
        return -15;
    }

    if (derivedCount > 5) {
        return -10;
    }

    return 0;
}

export function calculateTier3Signals(entry: WiktextractEntry): number {
    let tier3 = 0;

    const hasAudio = entry.sounds?.some(
        (s) => s.audio || s.mp3_url || s.ogg_url,
    );
    if (hasAudio) {
        tier3 -= 10;
    }

    const hasExamples = entry.senses?.some(
        (s) => s.examples && s.examples.length > 0,
    );
    if (hasExamples) {
        tier3 -= 8;
    }

    if ((entry.senses?.length ?? 0) >= 5) {
        tier3 -= 10;
    } else if ((entry.senses?.length ?? 0) >= 3) {
        tier3 -= 5;
    }

    if ((entry.forms?.length ?? 0) > 20) {
        tier3 -= 8;
    }

    return tier3;
}

export function calculateWordLength(word: string): number {
    let score = 0;
    const wordLength = word.length;
    if (wordLength >= 15) {
        score += 8; // Very long words tend to be technical/rare
    } else if (wordLength >= 12) {
        score += 5; // Long words
    } else if (wordLength <= 4) {
        score -= 8; // Very short words tend to be common (casa, cane, mare)
    } else if (wordLength <= 6) {
        score -= 3; // Short words
    }

    // Exception: short words with rare letters/patterns can be literary
    if (
        wordLength <= 6 &&
        /[qxjkwy]|([bcdfglmnprstvz])\1/.test(word.toLowerCase())
    ) {
        score += 3; // Compensate: rare phonetic patterns
    }

    return score;
}

export function defaultClampingFn(
    entry: WiktextractEntry,
    score: number,
): number {
    const clamped = Math.max(1, Math.min(100, score));
    return entry.tags?.includes("vulgar") ||
        entry.senses?.some((s) => s.tags?.includes("vulgar"))
        ? Math.max(clamped, 8)
        : clamped;
}

/**
 * Calculates rarity score for a word based on various signals
 */
export function calculateRarity(
    entry: WiktextractEntry,
    frequencyMap: Map<string, number> | undefined,
    options: CalculateRarityOptions = DEFAULT_RARITY_CALCULATION_OPTIONS,
): number {
    let score = options.baseScore;

    // Tier 0 frequency scoring
    if (frequencyMap && options.includeFrequency) {
        const frequencyRank = frequencyMap.get(entry.word);
        score += options.frequencyRarityFn
            ? options.frequencyRarityFn(frequencyRank)
            : 0;
    }

    // Pre-calculate common metrics
    const sensesCount = entry.senses?.length || 0;
    const formsCount = entry.forms?.length || 0;
    const derivedCount = entry.derived?.length || 0;
    const pos = entry.pos || "";

    // === TIER 1: Strong Indicators ===

    // 1. Explicit rarity tags
    if (options.includeRarityTags) {
        score += options.rarityTagFn
            ? options.rarityTagFn(
                  entry.senses,
                  options.customRarityTagScores || RARITY_TAG_SCORES,
                  entry.tags || [],
              )
            : 0;
    }

    // 2. Technical/specialized categories
    if (options.includeTechnicalCategory) {
        score += options.technicalCategoryFn
            ? options.technicalCategoryFn(
                  entry.senses,
                  entry.categories || [],
                  entry.lang_code as LanguageCode,
              )
            : 0;
    }

    // === TIER 1.5: Frequency of Use Signals ===

    // Heavily conjugated verbs are fundamental
    if (options.includeVerbConjugation) {
        score += options.verbConjugationFn
            ? options.verbConjugationFn(pos, formsCount)
            : 0;
    }

    // Polysemous + productive = semantic nucleus
    if (options.includePolysemous) {
        score += options.polysemousFn
            ? options.polysemousFn(pos, sensesCount, derivedCount)
            : 0;
    }

    // === TIER 2: Medium Indicators (±8-20 points) ===
    if (
        options.includePosRarityModifier &&
        pos in (options.customPosRarityModifier || POS_RARITY_MODIFIER)
    ) {
        score += (options.customPosRarityModifier || POS_RARITY_MODIFIER)[pos];
    }

    if (options.includeDerivedCount) {
        score += options.derivedCountFn
            ? options.derivedCountFn(derivedCount)
            : calculateDerivedCount(derivedCount);
    }

    // === TIER 3: Weak Indicators ===
    if (options.includeTier3Signals) {
        score += options.tier3SignalFn
            ? options.tier3SignalFn(entry)
            : calculateTier3Signals(entry);
    }

    // 9. Word length analysis
    if (options.includeWordLength) {
        score += options.wordLengthFn
            ? options.wordLengthFn(entry.word)
            : calculateWordLength(entry.word);
    }

    const clamped = options.clampingFn
        ? options.clampingFn(entry, score)
        : defaultClampingFn(entry, score);

    return clamped;
}

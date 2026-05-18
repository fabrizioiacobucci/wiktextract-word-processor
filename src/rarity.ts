import * as fs from "node:fs";
import { LanguageCode, WiktextractEntry } from "./types.ts";
import {
    CalculateRarityOptions,
    DEFAULT_RARITY_CALCULATION_OPTIONS,
    POS_RARITY_MODIFIER,
    RARITY_TAG_SCORES,
    TECHNICAL_CATEGORIES,
} from "./rarity.types.ts";

export function getFrequencyRarityAdjustment(
    word: string,
    rank: Map<string, number>,
): number {
    const rankValue = rank.entries().find(([w, r]) => w == word)?.[1];

    if (rankValue === undefined) {
        return 5;
    }

    const maxRank = Math.max(...rank.values());
    const set = maxRank / 4;

    if (rankValue <= set) {
        return -15;
    }

    if (rankValue <= set * 2 && rankValue > set) {
        return -10;
    }

    if (rankValue <= set * 3 && rankValue > set * 2) {
        return -7;
    }

    if (rankValue > set * 3) {
        return -5;
    }

    return 5;
}

export function loadFrequencyData(filePath: string): Map<string, number> {
    const frequencyRanks = new Map<string, number>();
    const frequency = new Map<string, number>();
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const lines = fileContents.split(/\r?\n/);
    let rank = 0;
    let lastFrequency = 0;

    for (const line of lines) {
        if (line.trim() === "") {
            continue;
        }

        // FrequencyWords format: "word count" (space-separated) or "word\tcount" (tab-separated)
        const separatorIndex = line.indexOf("\t");
        const [word, freq] = line.split(separatorIndex > 0 ? "\t" : " ");

        frequency.set(word, Number(freq));
    }

    frequency.entries().forEach(([w, f]) => {
        if (lastFrequency == 0) {
            rank++;
            frequencyRanks.set(w, rank);
            lastFrequency = f;
        }

        if (lastFrequency > 0) {
            if (lastFrequency == f) {
                frequencyRanks.set(w, rank);
            }

            if (lastFrequency != f) {
                rank++;
                frequencyRanks.set(w, rank);
                lastFrequency = f;
            }
        }
    });

    return frequencyRanks;
}

export function calculateRarityTag(
    senses: WiktextractEntry["senses"],
    rarityTagScores: Record<string, number>,
    tags: string[],
    rarityMap?: { [key: string]: number | boolean },
): { score: number; count: number } {
    let score = 0;
    const sensesCount = senses?.length || 0;
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

    return {
        score: score * (rarityMap?.hasFrequency ? 0.5 : 1),
        count: senseTagCounts.keys().toArray().length,
    };
}

export function calculateTechnicalCategory(
    senses: WiktextractEntry["senses"],
    categories: string[],
    lang: LanguageCode,
    rarityMap?: { [key: string]: number | boolean },
): { score: number; count: number } {
    const technicalCategories = TECHNICAL_CATEGORIES[lang] || [];
    let score = 0;
    let techCategories = 0;
    let techTopics = 0;

    if (technicalCategories.length === 0) {
        return { score, count: 0 }; // No technical category data for this language
    }

    // Check sense-level topics
    for (const sense of senses || []) {
        const topics = sense.categories || [];
        if (
            topics.some((t) =>
                technicalCategories.some((tech) =>
                    t.toLowerCase().startsWith(tech),
                ),
            )
        ) {
            techTopics += 1;
        }
    }

    // Check entry-level categories
    for (const cat of categories) {
        const catLower = cat.toLowerCase();
        if (technicalCategories.some((tech) => catLower.startsWith(tech))) {
            techCategories += 1;
        }
    }

    score +=
        (5 * techTopics + 3 * techCategories) *
        ((rarityMap?.tagsCount as number) > 0 ? 1.25 : 1);

    return { score, count: techTopics + techCategories };
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

    if (sensesCount >= 4 && derivedCount >= 5) {
        return -10; // Highly polysemous + productive words are usually common
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

export function calculateWordLength(
    word: string,
    rarityMap?: { [key: string]: number | boolean },
): number {
    let score = 0;
    const wordLength = word.length;
    if (wordLength >= 15) {
        score += 8; // Very long words tend to be technical/rare
    } else if (wordLength >= 12) {
        score += 5; // Long words
    } else if (rarityMap?.hasFrequency && wordLength <= 4) {
        score -= 8; // Very short words tend to be common (casa, cane, mare)
    } else if (rarityMap?.hasFrequency && wordLength <= 6) {
        score -= 3; // Short words
    }

    // Exception: short words with rare letters/patterns can be literary
    if (
        wordLength <= 6 &&
        /[qxjkwy]|([bcdfglmnprstvz])\1/.test(word.toLowerCase())
    ) {
        score += 5; // Compensate: rare phonetic patterns
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
): { score: number; map: object } {
    let score = options.baseScore;
    const hasFrequency = frequencyMap
        ? !!frequencyMap.entries().find((v) => v[0] == entry.word)
        : false;

    const rarityMap: { [key: string]: number | boolean } = {
        frequency: 0,
        hasFrequency,
        tags: 0,
        tagsCount: 0,
        categories: 0,
        categoriesCount: 0,
        conjugation: 0,
        polysemous: 0,
        pos: 0,
        derived: 0,
        tier3: 0,
        length: 0,
        clamping: 0,
    };

    // Tier 0 frequency scoring
    if (frequencyMap && options.includeFrequency) {
        const frequencyRank = options.frequencyRarityFn
            ? options.frequencyRarityFn(entry.word, frequencyMap)
            : 0;
        score += frequencyRank;
        rarityMap.frequency = frequencyRank;
    }

    // Pre-calculate common metrics
    const sensesCount = entry.senses?.length || 0;
    const formsCount = entry.forms?.length || 0;
    const derivedCount = entry.derived?.length || 0;
    const pos = entry.pos || "";

    // === TIER 1: Strong Indicators ===

    // 1. Explicit rarity tags
    if (options.includeRarityTags) {
        const fn = options.rarityTagFn ?? calculateRarityTag;
        const tagResult = fn(
            entry.senses,
            options.customRarityTagScores || RARITY_TAG_SCORES,
            entry.tags || [],
            rarityMap,
        );
        score += tagResult.score;
        rarityMap.tags = tagResult.score;
        rarityMap.tagsCount = tagResult.count;
    }

    // 2. Technical/specialized categories
    if (options.includeTechnicalCategory) {
        const fn = options.technicalCategoryFn ?? calculateTechnicalCategory;
        const techResult = fn(
            entry.senses,
            entry.categories || [],
            entry.lang_code as LanguageCode,
            rarityMap,
        );
        score += techResult.score;
        rarityMap.categories = techResult.score;
        rarityMap.categoriesCount = techResult.count;
    }

    // === TIER 1.5: Frequency of Use Signals ===

    // Heavily conjugated verbs are fundamental
    if (options.includeVerbConjugation && entry.pos == "verb") {
        const fn = options.verbConjugationFn ?? calculateVerbConjugation;
        const add = fn(pos, formsCount);
        score += add;
        rarityMap.conjugation = add;
    }

    // Polysemous + productive = semantic nucleus
    if (options.includePolysemous) {
        const fn = options.polysemousFn ?? calculatePolysemous;
        const add = fn(pos, sensesCount, derivedCount);
        score += add;
        rarityMap.polysemous = add;
    }

    // === TIER 2: Medium Indicators (±8-20 points) ===
    if (
        options.includePosRarityModifier &&
        pos in (options.customPosRarityModifier || POS_RARITY_MODIFIER)
    ) {
        const add = (options.customPosRarityModifier || POS_RARITY_MODIFIER)[
            pos
        ];
        score += add;
        rarityMap.pos = add;
    }

    if (options.includeDerivedCount) {
        const fn = options.derivedCountFn ?? calculateDerivedCount;
        const add = fn(derivedCount);
        score += add;
        rarityMap.derived = add;
    }

    // === TIER 3: Weak Indicators ===
    if (
        options.includeTier3Signals &&
        (hasFrequency || (rarityMap.tags as number) <= 0)
    ) {
        const fn = options.tier3SignalFn ?? calculateTier3Signals;
        const add = fn(entry);
        score += add;
        rarityMap.tier3 = add;
    }

    // 9. Word length analysis
    if (options.includeWordLength) {
        const fn = options.wordLengthFn ?? calculateWordLength;
        const add = fn(entry.word, rarityMap);
        score += add;
        rarityMap.length = add;
    }

    const clamped = options.clampingFn
        ? options.clampingFn(entry, score)
        : defaultClampingFn(entry, score);

    rarityMap.clamping = score - clamped;

    return { score: clamped, map: rarityMap };
}

import {
    getFrequencyRarityAdjustment,
    calculateRarityTag,
    calculateTechnicalCategory,
    calculateVerbConjugation,
    calculatePolysemous,
    calculateDerivedCount,
    calculateTier3Signals,
    calculateWordLength,
    defaultClampingFn,
} from "../helpers/rarity";
import { WiktextractEntry } from "./word.types";
import { LanguageCode } from "./generic.types";

export interface CalculateRarityOptions {
    baseScore: number;
    includeFrequency?: boolean;
    includeRarityTags?: boolean;
    customRarityTagScores?: Record<string, number>;
    includeTechnicalCategory?: boolean;
    includeVerbConjugation?: boolean;
    includePolysemous?: boolean;
    includePosRarityModifier?: boolean;
    customPosRarityModifier?: Record<string, number>;
    includeDerivedCount?: boolean;
    includeTier3Signals?: boolean;
    includeWordLength?: boolean;
    frequencyRarityFn?: (
        word: string,
        rank: Map<string, number>,
        maxRank: number,
    ) => number;
    rarityTagFn?: (
        senses: WiktextractEntry["senses"],
        rarityTagScores: Record<string, number>,
        tags: string[],
        rarityMap?: RarityMap,
    ) => { score: number; count: number };
    technicalCategoryFn?: (
        senses: WiktextractEntry["senses"],
        categories: string[],
        lang: LanguageCode,
        rarityMap?: RarityMap,
    ) => { score: number; count: number };
    verbConjugationFn?: (pos: string, formsCount: number) => number;
    polysemousFn?: (
        pos: string,
        sensesCount: number,
        derivedCount: number,
    ) => number;
    derivedCountFn?: (derivedCount: number) => number;
    tier3SignalFn?: (entry: WiktextractEntry) => number;
    wordLengthFn?: (word: string, rarityMap?: RarityMap) => number;
    clampingFn?: (entry: WiktextractEntry, score: number) => number;
}

export const DEFAULT_RARITY_CALCULATION_OPTIONS: CalculateRarityOptions = {
    baseScore: 40,
    includeFrequency: true,
    includeRarityTags: true,
    includeTechnicalCategory: true,
    includeVerbConjugation: true,
    includePolysemous: true,
    includePosRarityModifier: true,
    includeDerivedCount: true,
    includeTier3Signals: true,
    includeWordLength: true,
    frequencyRarityFn: getFrequencyRarityAdjustment,
    rarityTagFn: calculateRarityTag,
    technicalCategoryFn: calculateTechnicalCategory,
    verbConjugationFn: calculateVerbConjugation,
    polysemousFn: calculatePolysemous,
    derivedCountFn: calculateDerivedCount,
    tier3SignalFn: calculateTier3Signals,
    wordLengthFn: calculateWordLength,
    clampingFn: defaultClampingFn,
};

export const RARITY_TAG_SCORES: Readonly<Record<string, number>> = {
    obsolete: 40,
    archaic: 30,
    rare: 18,
    literary: 20,
    poetic: 20,
    historical: 15,
    dialectal: 15,
    formal: 10,
    regional: 0,
    // figuratively: -10,
    // broadly: -10,
    vulgar: -10,
    slang: -10,
    informal: -15,
    colloquial: -20,
    common: -30,
} as const;

export const POS_RARITY_MODIFIER: Record<string, number> = {
    character: 40,
    prefix: 30,
    suffix: 30,
    name: 20,
    proverb: 18,
    interj: 15,
    contraction: 15,
    phrase: 12,
    adv: 8,
    adj: -2,
    noun: -3,
    verb: -3,
};

export interface RarityMap {
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
}

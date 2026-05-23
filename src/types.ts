import {
    EXTERNAL_SOURCES,
    FILTER_DEFINITION,
    FILTER_ETYMOLOGY_CONTENT,
    FILTER_ETYMOLOGY_LENGTH,
    FILTER_POS,
} from "./filters";

export type filterOptions = {
    filterExternalSources?: boolean; // Filter entries from specific external sources (e.g., Treccani)
    customExternalSources?: string[]; // Custom list of external sources to filter (case-insensitive)
    filterMissingDefinitions?: boolean; // Filter entries with missing definitions (e.g., "definizione mancante")
    customDefinitionPlaceholders?: string[]; // Custom list of definition placeholders to filter (case-insensitive)
    filterEtymologyContent?: boolean; // Filter entries with missing or placeholder etymologies (e.g., "etimologia mancante", "vedi", "vedasi")
    customEtymologyPlaceholders?: string[]; // Custom list of etymology placeholders to filter (case-insensitive)
    filterEtymologyLength?: boolean; // Filter entries with etymology texts below a certain length
    minEtymologyLength?: number; // Minimum length for etymology texts (default: 40 characters)
    filterPOS?: boolean; // Filter entries based on part of speech (e.g., exclude "voce verbale", "forma flessa", etc.)
    customPOSFilters?: string[]; // Custom list of POS tags to filter (case-insensitive)
};

export const DEFAULT_FILTER_OPTIONS: filterOptions = {
    filterExternalSources: true,
    customExternalSources: EXTERNAL_SOURCES as unknown as string[],
    filterMissingDefinitions: true,
    customDefinitionPlaceholders: FILTER_DEFINITION as unknown as string[],
    filterEtymologyContent: true,
    customEtymologyPlaceholders:
        FILTER_ETYMOLOGY_CONTENT as unknown as string[],
    filterEtymologyLength: true,
    minEtymologyLength: FILTER_ETYMOLOGY_LENGTH as unknown as number,
    filterPOS: true,
    customPOSFilters: FILTER_POS as unknown as string[],
} as const;

export const POS_MAPPING: Record<LanguageCode, Record<string, string>> = {
    it: {
        noun: "sostantivo",
        verb: "verbo",
        adj: "aggettivo",
        adv: "avverbio",
        name: "nome proprio",
        prefix: "prefisso",
        suffix: "suffisso",
        interj: "interiezione",
        contraction: "contrazione",
        character: "carattere",
        proverb: "proverbio",
        phrase: "locuzione",
        prep: "preposizione",
        conj: "congiunzione",
        pron: "pronome",
        det: "determinante",
        article: "articolo",
        num: "numerale",
    },
    en: {
        noun: "noun",
        verb: "verb",
        adj: "adjective",
        adv: "adverb",
        name: "proper noun",
        prefix: "prefix",
        suffix: "suffix",
        interj: "interjection",
        contraction: "contraction",
        character: "character",
        proverb: "proverb",
        phrase: "phrase",
        prep: "preposition",
        conj: "conjunction",
        pron: "pronoun",
        det: "determiner",
        article: "article",
        num: "numeral",
    },
    // Add mappings for other languages as needed
    es: {},
    fr: {},
    de: {},
};

export const rarityTagScores: Readonly<Record<string, number>> = {
    obsolete: 40,
    archaic: 30,
    rare: 18,
    literary: 20,
    poetic: 20,
    historical: 15,
    dialectal: 15,
    regional: 0,
    formal: 10,
    figuratively: -10,
    broadly: -10,
    vulgar: -10,
    slang: -15,
    informal: -15,
    colloquial: -20,
    common: -30,
} as const;

// === DATE & TIMESTAMP TYPES ===

/**
 * ISO 8601 date-time string (e.g., "2025-11-06T10:30:00.000Z")
 *
 * Use cases:
 * - Firestore document timestamps (createdAt, updatedAt)
 * - Wiktextract extraction dates
 * - Any date that needs to be stored/serialized
 *
 * Always in UTC timezone. Use helper functions for conversion:
 * - toISODateString(new Date()) → "2025-11-06T10:30:00.000Z"
 * - fromISODateString(str) → Date object
 */
export type ISODateString = string;

function isISOFormat(date: string) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/.test(date);
}
/**
 * Unix timestamp in milliseconds (e.g., 1699267800000)
 *
 * Use cases:
 * - Expiration times (easy comparison: Date.now() > expiresAt)
 * - Rate limiting timestamps
 * - Any time that needs numeric comparison
 *
 * Use helper functions for conversion:
 * - toUnixTimestamp(new Date()) → 1699267800000
 * - fromUnixTimestamp(ts) → Date object
 */
export type UnixTimestamp = number;

// Helper functions for date conversion
export const toUTCDateString = (date: Date): ISODateString =>
    date.toISOString();
export const fromISODateString = (str: ISODateString): Date => new Date(str);
export const toUnixTimestamp = (date: Date): UnixTimestamp => date.getTime();
export const fromUnixTimestamp = (ts: UnixTimestamp): Date => new Date(ts);

export type ValidationResult =
    | { valid: true }
    | {
          valid: false;
          reason: string;
      };

interface SenseExample {
    text: string;
    bold_text_offsets: [number[]];
    translation: string;
    ref: string;
    roman: string;
    bold_roman_offsets: [number[]];
    bold_translation_offsets: [number[]];
    tags: string[];
}

interface SenseForm {
    word: string;
}

interface Sense {
    glosses: string[];
    raw_tags: string[];
    tags: string[];
    form_of: SenseForm[];
    examples: SenseExample[];
    categories: string[];
    topics: string[];
}

interface Translation {
    lang_code: string;
    lang: string;
    word: string;
    sense: string;
    roman: string;
    tags: string[];
    raw_tags: string[];
}

interface Hyphenation {
    parts: string[];
    sense: string;
}

interface Sound {
    ipa: string;
    sense: string;
    audio: string;
    ogg_url: string;
    mp3_url: string;
    raw_tags: string[];
    wav_url: string;
    oga_url: string;
    opus_url: string;
    tags: string[];
    flac_url: string;
}

interface SemanticRelation {
    word: string;
    raw_tags: string[];
    tags: string[];
}

interface Proverb {
    word: string;
    sense: string;
}

interface Form {
    form: string;
    tags: string[];
    raw_tags: string[];
    source: string;
}

export interface WiktextractEntry {
    word: string;
    lang_code: string;
    lang: string;
    pos: string;
    pos_title: string;
    senses?: Sense[];
    categories?: string[];
    translations?: Translation[];
    etymology_texts?: string[];
    hyphenations?: Hyphenation[];
    sounds?: Sound[];
    synonyms?: SemanticRelation[];
    derived?: SemanticRelation[];
    related?: SemanticRelation[];
    proverbs?: Proverb[];
    tags?: string[];
    forms?: Form[];
    hypernyms?: SemanticRelation[];
    antonyms?: SemanticRelation[];
    hyponyms?: SemanticRelation[];
    raw_tags?: string[];
    notes?: string[];
    title?: string;
    redirect?: string;
}

export const SUPPORTED_LANGUAGE_CODES = ["it", "en", "es", "fr", "de"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];
export type languages = LanguageCode;

export type Word = WiktextractEntry & {
    // === BASE FIELDS ===
    id: string;

    // === LEXIBA METADATA ===
    rarity: number; // 1-100
    rarityMap: object;
    rand: number; // 0-1 for random sampling

    // === ATTRIBUTION ===
    source: "wiktionary";
    license: string; // "CC BY-SA 4.0"
    url: string;

    // === TIMESTAMPS ===
    createdAt: ISODateString; // When document was created in Supabase
    updatedAt?: ISODateString; // Last update timestamp
};

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
    date.toUTCString();
export const fromISODateString = (str: ISODateString): Date => new Date(str);
export const toUnixTimestamp = (date: Date): UnixTimestamp => date.getTime();
export const fromUnixTimestamp = (ts: UnixTimestamp): Date => new Date(ts);

export interface WiktextractEntry {
    // Identifiers
    word: string; // "linfa", "serendipità"
    lang: string; // "Italian" for Italian dump
    lang_code: string; // "it"

    // Part of speech
    pos: string; // "noun", "adj", "verb", "adv", etc.
    pos_title?: string;

    // Definitions (senses)
    senses?: Array<{
        glosses: string[]; // ["main definition", "secondary definition"]
        examples?: Array<{
            text: string; // Usage example
            type?: string; // "example", "quotation"
            ref?: string; // Source reference
        }>;
        tags?: string[]; // ["figurative", "informal", etc.]
        categories?: string[]; // Specific categories for this sense
        raw_glosses?: string[]; // Raw version without processing
    }>;

    // Etymology
    etymology_texts?: string[]; // "from Latin lympha"
    etymology_templates?: Array<{
        name: string; // "etimo", "der", etc.
        args?: {
            [key: string]: string; // { "lingua": "la", "1": "lympha" }
        };
        expansion?: string; // Template expansion
    }>;
    etymology_number?: number; // For words with multiple etymologies

    // Pronunciation
    sounds?: Array<{
        ipa?: string; // "/ˈlinfa/"
        audio?: string; // Filename on Wikimedia Commons
        audio_ipa?: string; // IPA for specific audio
        ogg_url?: string; // Direct audio file URL
        mp3_url?: string; // Direct MP3 audio file URL
        tags?: string[]; // ["Toscana"], ["Milano"], etc.
    }>;

    // Forms (conjugations, declensions)
    forms?: Array<{
        form: string; // Inflected form
        tags: string[]; // ["plural"], ["feminine"], etc.
        source?: string; // "inflection-table", etc.
        raw_tags?: string[]; // Raw tags before processing
    }>;

    // Synonyms/Antonyms
    synonyms?: Array<{
        word: string;
        sense?: string; // Which sense it refers to
        tags?: string[];
    }>;
    antonyms?: Array<{
        word: string;
        sense?: string;
        tags?: string[];
    }>;

    // Related words
    related?: Array<{
        word: string;
        tags?: string[];
    }>;
    derived?: Array<{
        // Derived words
        word: string;
        tags?: string[];
    }>;

    // Translations
    translations?: Array<{
        lang: string; // "English", "Spanish", etc.
        lang_code: string; // "en", "es", etc.
        word: string; // Translation
        sense?: string; // Which sense it refers to
        tags?: string[];
    }>;

    // Metadata
    categories?: string[]; // ["Italian lemmas", "Italian nouns", "it:Biology"]
    tags?: string[]; // ["feminine", "masculine", "countable", etc.]
    topics?: string[]; // ["biology", "medicine", "law", etc.]

    // Wiktionary page info (if available in dump)
    wiktionary_page_id?: number; // MediaWiki page ID
    wiktionary_revision_id?: number; // Revision ID from which data was extracted
    last_modified?: string; // ISO timestamp "2025-01-15T10:30:00Z"

    // Other potentially present fields
    hyphenation?: string[]; // Syllabication ["lin", "fa"]
    head_templates?: Array<{
        // Page head templates
        name: string;
        args?: { [key: string]: string };
        expansion?: string;
    }>;

    // Notes and references
    notes?: string[];
    references?: Array<{
        text?: string;
        url?: string;
    }>;
}

export const SUPPORTED_LANGUAGE_CODES = ["it", "en", "es", "fr", "de"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];
export type languages = LanguageCode;

export interface WordDefinition {
    text: string; // Definition text
    examples?: string[]; // Examples for THIS definition
    tags?: string[]; // Semantic tags: "formal", "informal", "figurative", etc.
    topics?: string[]; // Thematic topics: "medicine", "law", "biology"
}

export interface WordEtymology {
    text: string; // Etymology text
    lang?: string; // Origin language code ("la", "gr")
    number?: number; // Etymology number (for polysemous words)
}

export interface WordPronunciation {
    ipa?: string; // IPA notation
    audio?: string; // Audio URL
    syllabication?: string; // Syllable breakdown
}

export interface WordForm {
    form: string;
    tags: string[];
}

export interface Word {
    // === BASE FIELDS ===
    id: string;
    lang: LanguageCode; // "it" | "en" | "es" | "fr" | "de"
    word: string; // The word text
    partOfSpeech: string[]; // "sostantivo", "aggettivo", "verbo" (Italian)

    // === DEFINITIONS (multiple senses) ===
    definitions: WordDefinition[]; // Array of all meanings

    // === ETYMOLOGY (can be multiple for polysemous words) ===
    etymologies: WordEtymology[];

    // === PRONUNCIATION ===
    pronunciations?: WordPronunciation[];

    // === EXAMPLES & QUOTES ===
    quotes?: Array<{
        text: string;
        author?: string;
        source?: string;
    }>;

    // === TRANSLATIONS ===
    translations?: Partial<Record<LanguageCode, string | string[]>>;

    // === SEMANTIC RELATIONS ===
    synonyms?: string[];
    antonyms?: string[];
    hypernyms?: string[]; // Broader terms
    hyponyms?: string[]; // Narrower terms
    related?: string[]; // Related words

    // === WIKTEXTRACT METADATA ===
    forms?: WordForm[];
    categories?: string[]; // Wiktionary categories
    tags?: string[]; // Global tags merged from all definitions

    // === LEXIBA METADATA ===
    rarity: number; // 1-100
    rand: number; // 0-1 for random sampling

    // === ATTRIBUTION ===
    source: "wiktionary";
    license: string; // "CC BY-SA 4.0"
    url: string;

    // === TIMESTAMPS ===
    createdAt: ISODateString; // When document was created in Supabase
    updatedAt?: ISODateString; // Last update timestamp
}

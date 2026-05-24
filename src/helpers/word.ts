import {
    LanguageCode,
    SUPPORTED_LANGUAGE_CODES,
    ValidationResult,
} from "../types/generic.types.ts";
import * as crypto from "node:crypto";
import { WiktextractEntry, Word } from "../types/word.types.ts";
import {
    dedupArray,
    isStringEmpty,
    sanitizeString,
    stableStringify,
} from "./generic.ts";
import {
    DEFAULT_FILTER_OPTIONS,
    filterOptions,
} from "../types/filters.types.ts";

export const isSupportedLanguageCode = (k: string): k is LanguageCode =>
    SUPPORTED_LANGUAGE_CODES.includes(k as LanguageCode);

export function parseSupportedLanguageCode(rawValue: string): LanguageCode {
    const normalized = rawValue.toLowerCase().trim();

    if (!isSupportedLanguageCode(normalized)) {
        throw new Error(
            `Language code not supported: ${rawValue}. Allowed values: ${SUPPORTED_LANGUAGE_CODES.join(", ")}`,
        );
    }

    return normalized;
}

export function normalizeLangCode(value: string): LanguageCode {
    try {
        return parseSupportedLanguageCode(value);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : `Language code not valid: ${value}`;
        console.error(`❌ ${message}`);
        process.exit(1);
    }
}

/**
 * Generates a unique ID for a word based on its text and part of speech
 */
export function generateWordId(word: string, pos: string): string {
    const normalized = word.toLowerCase().trim();
    const hash = crypto
        .createHash("md5")
        .update(`${normalized}-${pos}`)
        .digest("hex")
        .substring(0, 8);
    return `${normalized}-${pos}-${hash}`;
}

/**
 * Sanitizes glosses by removing leading punctuation and whitespace
 */
export function sanitizeEntry(word: WiktextractEntry): WiktextractEntry {
    word.senses = word.senses?.map((sense) => {
        sense.glosses = sense.glosses?.map((gloss) => {
            return sanitizeString(gloss);
        });

        sense.examples = cleanup(sense.examples, "text");

        if (
            sense.glosses?.some((g) => g.trim().endsWith(":")) &&
            (!sense.examples || sense.examples?.length == 0)
        ) {
            const withCol = sense.glosses?.filter((g) =>
                g.trim().endsWith(":"),
            );
            const woCol = sense.glosses?.filter((g) => !g.trim().endsWith(":"));
            sense.glosses = [
                ...woCol,
                ...withCol.map((gloss) => {
                    return gloss.trim().substring(0, gloss.length - 1);
                }),
            ];
        }

        sense.glosses = dedupArray(
            sense.glosses?.filter((gloss) => !isStringEmpty(gloss)),
        );

        return sense;
    });

    word.categories = cleanup(word.categories);
    word.etymology_texts = cleanup(word.etymology_texts);
    word.synonyms = cleanup(word.synonyms, "word");
    word.derived = cleanup(word.derived, "word");
    word.related = cleanup(word.related, "word");
    word.antonyms = cleanup(word.antonyms, "word");
    word.hypernyms = cleanup(word.hypernyms, "word");
    word.hyponyms = cleanup(word.hyponyms, "word");
    word.translations = cleanup(word.translations, "sense", false);
    word.hyphenations = cleanup(word.hyphenations, "sense", false);
    word.sounds = cleanup(word.sounds, "sense", false);
    word.proverbs = cleanup(word.proverbs, "sense", false);
    word.forms = dedupArray(word.forms ?? [], "form");

    return word;
}

const cleanup = (array?: any[], key?: string, filter: boolean = true) => {
    return dedupArray(
        array
            ?.map((item) => {
                if (key) item[key] = sanitizeString(item[key], false);

                if (!key) item = sanitizeString(item, false);

                return item;
            })
            ?.filter((item) =>
                filter ? !isStringEmpty(key ? item[key] : item) : true,
            ) ?? [],
    );
};

/**
 * Filters out unwanted entries based on quality criteria
 */
export function shouldFilterEntry(
    entry: WiktextractEntry,
    langCode: LanguageCode,
    options: filterOptions = DEFAULT_FILTER_OPTIONS,
): boolean {
    // Must match target language
    if (entry.lang_code !== langCode) {
        return true;
    }

    // Filter Treccani references
    if (
        options.filterExternalSources &&
        options.customExternalSources?.some((source) =>
            JSON.stringify(entry).toLowerCase().includes(source.toLowerCase()),
        )
    ) {
        return true;
    }

    if (options.filterMissingDefinitions) {
        // Must have senses (definitions)
        if (!entry.senses) return true;
        if (entry.senses.length === 0) return true;
        if (entry.senses.flatMap((s) => s.glosses).length === 0) return true;
        if (entry.senses.length === 1) {
            if (!entry.senses[0].glosses) return true;
            if (entry.senses[0].glosses.length === 0) return true;
            if (
                entry.senses[0].tags?.includes("no-gloss") ||
                entry.senses[0].glosses[0]?.includes("*")
            ) {
                return true;
            }
        }
    }

    // Filter entries with missing definitions
    if (options.filterMissingDefinitions) {
        if (
            options.customDefinitionPlaceholders?.some((placeholder) =>
                entry.senses?.some(
                    (sense) =>
                        sense.glosses &&
                        sense.glosses.length > 0 &&
                        sense.glosses[0]
                            .toLowerCase()
                            .includes(placeholder.toLowerCase()),
                ),
            )
        ) {
            return true;
        }
    }

    // Filter entries with missing or placeholder etymologies
    if (options.filterEtymologyLength || options.filterEtymologyContent) {
        if (!entry.etymology_texts || entry.etymology_texts.length === 0) {
            return true;
        }

        let etymologyText = "";
        entry.etymology_texts.forEach((et) => {
            while (et.startsWith("(") && et.includes(")")) {
                et = et.slice(et.indexOf(")") + 1);
            }
            etymologyText += et;
        });

        etymologyText = etymologyText.toLowerCase().trim();
        if (
            options.filterEtymologyLength &&
            etymologyText.length < options.minEtymologyLength!
        ) {
            return true;
        }

        if (
            options.filterEtymologyContent &&
            options.customEtymologyPlaceholders?.some(
                (placeholder) =>
                    placeholder &&
                    (etymologyText.includes(placeholder.toLowerCase()) ||
                        etymologyText.startsWith(placeholder.toLowerCase())),
            )
        ) {
            return true;
        }
    }

    // Filter certain POS types
    const posTitle = entry.pos_title?.toLowerCase() || "";
    if (
        options.filterPOS &&
        options.customPOSFilters?.some((pos) =>
            posTitle.includes(pos.toLowerCase()),
        )
    ) {
        return true;
    }

    return false;
}

export const isWord = (w: unknown): w is Word => {
    if (!w) return false;
    return (
        typeof w === "object" &&
        "id" in w &&
        "lang" in w &&
        "word" in w &&
        "rarity" in w &&
        "rarityMap" in w
    );
};

export function getEntryLang(
    entry: Word | WiktextractEntry,
): string | undefined {
    if (isWord(entry)) {
        return normalizeLangCode(entry.lang);
    }

    return normalizeLangCode(entry.lang_code);
}

export function validateRecord(record: unknown): ValidationResult {
    const missingFields: string[] = [];

    if (!record || typeof record !== "object") {
        return {
            valid: false,
            reason: "record is not an object",
        };
    }

    const candidateRecord = record as Partial<Word>;

    if (!candidateRecord.id || typeof candidateRecord.id !== "string") {
        missingFields.push("id");
    }

    if (!candidateRecord.word || typeof candidateRecord.word !== "string") {
        missingFields.push("word");
    }

    if (
        !Array.isArray(candidateRecord.senses) ||
        candidateRecord.senses.length === 0
    ) {
        missingFields.push("definitions");
    }

    if (
        !Array.isArray(candidateRecord.etymology_texts) ||
        candidateRecord.etymology_texts.length === 0
    ) {
        missingFields.push("etymologies");
    }

    if (!candidateRecord.rarity || typeof candidateRecord.rarity !== "number") {
        missingFields.push("rarity");
    }

    if (missingFields.length > 0) {
        return {
            valid: false,
            reason: `missing/not valid fields: ${missingFields.join(", ")}`,
        };
    }

    return { valid: true };
}

export function deterministicDocumentId(entry: Word): string {
    if (typeof entry.id === "string" && entry.id) {
        return entry.id;
    }

    const base = stableStringify({
        lang: getEntryLang(entry) ?? "",
        word: entry.word ?? "",
        definitions: entry.senses ?? [],
    });

    return crypto.createHash("sha1").update(base).digest("hex");
}

export const mergeWords = (w1: Word, w2: Word) => {
    if (w1.word.toLowerCase().trim() !== w2.word.toLowerCase().trim())
        throw "Words to merge are different";

    if (normalizeLangCode(w1.lang_code) !== normalizeLangCode(w2.lang_code))
        throw "Languages of words to merge are different";

    const result = { ...w1 };

    result.pos = dedupArray([...result.pos, ...w2.pos]);
    result.pos_title = dedupArray([...result.pos_title, ...w2.pos_title]);

    // Merge definitions (deduplica per contenuto testuale)
    result.senses = dedupArray([...result.senses, ...w2.senses], "glosses");

    if (w2.categories) {
        result.categories = dedupArray([
            ...(result.categories || []),
            ...w2.categories,
        ]);
    }

    if (w2.translations) {
        result.translations = dedupArray(
            [...(result.translations ?? []), ...w2.translations],
            "word",
            "lang_code",
        );
    }

    // Merge etymologies (deduplica per testo)
    result.etymology_texts = dedupArray([
        ...(w1.etymology_texts ?? []),
        ...(w2.etymology_texts ?? []),
    ]);

    result.hyphenations = dedupArray(
        [...(result.hyphenations ?? []), ...(w2.hyphenations ?? [])],
        "parts",
    );

    // Merge pronunciations (deduplica per IPA)
    result.sounds = dedupArray(
        [...(result.sounds || []), ...(w2.sounds || [])],
        "ipa",
    );

    // Merge synonyms/antonyms/related (deduplica stringhe)
    if (w2.synonyms) {
        result.synonyms = dedupArray(
            [...(result.synonyms || []), ...w2.synonyms],
            "word",
        );
    }

    if (w2.derived) {
        result.derived = dedupArray(
            [...(result.derived || []), ...w2.derived],
            "word",
        );
    }

    if (w2.related) {
        result.related = dedupArray(
            [...(result.related || []), ...w2.related],
            "word",
        );
    }

    if (w2.proverbs) {
        result.proverbs = dedupArray(
            [...(result.proverbs ?? []), ...w2.proverbs],
            "word",
        );
    }

    if (w2.tags) {
        result.tags = Array.from(new Set([...(result.tags || []), ...w2.tags]));
    }

    w1.forms = dedupArray(
        [...(result.forms || []), ...(w2.forms || [])],
        "form",
    );

    if (w2.hypernyms) {
        result.hypernyms = dedupArray(
            [...(result.hypernyms || []), ...w2.hypernyms],
            "word",
        );
    }

    if (w2.antonyms) {
        result.antonyms = dedupArray(
            [...(result.antonyms || []), ...w2.antonyms],
            "word",
        );
    }

    if (w2.hyponyms) {
        result.hyponyms = dedupArray(
            [...(result.hyponyms || []), ...w2.hyponyms],
            "word",
        );
    }

    if (w2.raw_tags) {
        result.raw_tags = Array.from(
            new Set([...(result.raw_tags || []), ...w2.raw_tags]),
        );
    }

    if (w2.notes) {
        result.notes = Array.from(
            new Set([...(result.notes || []), ...w2.notes]),
        );
    }

    if (w2.unknown_tags) {
        result.unknown_tags = Array.from(
            new Set([...(result.unknown_tags || []), ...w2.unknown_tags]),
        );
    }

    result.rarity = (result.rarity + w2.rarity) / 2;

    return result;
};

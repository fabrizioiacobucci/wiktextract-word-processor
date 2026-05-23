import { calculateRarity } from "./rarity.ts";
import {
    DEFAULT_FILTER_OPTIONS,
    filterOptions,
    LanguageCode,
    POS_MAPPING,
    SUPPORTED_LANGUAGE_CODES,
    toUTCDateString,
    ValidationResult,
    WiktextractEntry,
    Word,
    WordForm,
} from "./types.ts";
import * as crypto from "node:crypto";

export function isStringEmpty(str: string): boolean {
    return str.replaceAll(/\W/gi, "").trim().length === 0;
}

/**
 * Capitalizes the first letter of a string, ignoring leading punctuation
 */
export function firstLetterToUpperCase(str: string): string {
    if (isStringEmpty(str)) return "";

    const beginning = str.match(/^\W*/);
    if (beginning) {
        const index = beginning[0].length;
        return (
            str.slice(0, index) +
            str.charAt(index).toUpperCase() +
            str.slice(index + 1)
        );
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitizes a string by removing leading punctuation and whitespace
 */
export function sanitizeString(
    str: string,
    firstUpper: boolean = true,
): string {
    if (isStringEmpty(str)) return "";
    return (firstUpper ? firstLetterToUpperCase(str) : str)
        .replaceAll(/^[\s;,.:\-!?]*/gi, "")
        .replaceAll(/([;,.:!?]+)\s?/gi, "$1 ")
        .replaceAll(/([\(\[])\s+/gi, "$1")
        .trim();
}

export function dedupArray<T, K extends keyof T>(
    array: T[],
    ...keyProp: K[]
): T[] {
    if (!array || array.length === 0) return array;

    const getKey = (element: T, props: K[]) => {
        const propsValue = [];
        for (const p of props) {
            propsValue.push(element[p]);
        }

        return propsValue.join("|").replaceAll(/\s/gi, "");
    };

    if (keyProp && keyProp.length > 0 && typeof array[0] === "object") {
        const result: T[] = [];
        for (const el of array) {
            if (result.find((e) => getKey(e, keyProp) === getKey(el, keyProp)))
                continue;

            result.push(el);
        }

        return result;
    }

    let setObj = new Set(array.map((x) => JSON.stringify(x)));
    return Array.from(setObj).map((x) => JSON.parse(x)) as T[];
}

export function mergeObjects<T extends object>(obj1: T, obj2: T): T {
    const merged: T = { ...obj1 };

    for (const key in obj2) {
        const k = key as keyof T;
        if (Array.isArray(obj2[k]) && Array.isArray(merged[k])) {
            merged[k] = dedupArray([...merged[k], ...obj2[k]]) as T[Extract<
                keyof T,
                string
            >];
        } else if (
            typeof obj2[k] === "object" &&
            typeof merged[k] === "object"
        ) {
            merged[k] = mergeObjects(
                merged[k] as object,
                obj2[k] as object,
            ) as T[Extract<keyof T, string>];
        } else {
            merged[k] = obj2[k] as T[Extract<keyof T, string>];
        }
    }

    return merged;
}

export function omit<T extends object, K extends keyof T>(
    obj: T,
    ...props: K[]
): Omit<T, K> {
    const result = { ...obj };
    props.forEach(function (prop) {
        delete result[prop];
    });
    return result;
}

export function isSupportedLanguageCode(value: string): value is LanguageCode {
    return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(value);
}

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

function mapPartOfSpeech(
    pos: string,
    posTitle?: string,
    langCode?: string,
    customMapping?: Record<string, string>,
): string {
    if (!langCode) {
        return posTitle || pos;
    }

    const mapping =
        customMapping || POS_MAPPING[langCode as LanguageCode] || {};

    if (Object.keys(mapping).length === 0) {
        return posTitle || pos;
    }

    return mapping[pos.toLowerCase()] || posTitle || pos;
}

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

/**
 * Converts a WiktextractEntry to a Word object
 */
export function convertToWord(
    entry: WiktextractEntry,
    langCode: LanguageCode,
    frequencyMap: Map<string, number> | undefined,
    maxRank: number,
): Word {
    const now = toUTCDateString(new Date());
    const wiktionaryLang = langCode;

    // Map definitions
    const definitions = (entry.senses ?? [])
        .filter(
            (s) =>
                (s.glosses?.filter((g) => !isStringEmpty(g)) ?? []).length > 0,
        )
        .map((sense) => ({
            text: sense.glosses?.[0],
            examples: sense.examples?.map((ex) => ex.text) || [],
            tags: sense.tags || [],
            topics: sense.categories || [],
        }));

    // Map etymologies
    const etymologies = entry.etymology_texts!.map((text, index) => ({
        text: text.trim(),
        number: entry.etymology_texts!.length > 1 ? index + 1 : undefined,
    }));

    // Map pronunciations
    const pronunciations = entry.sounds?.map((sound) => ({
        ipa: sound.ipa,
        audio: sound.mp3_url || sound.ogg_url || sound.audio,
    }));

    // Extract all unique tags from entry and senses
    const allTags = new Set<string>([...(entry.tags || [])]);
    for (const sense of entry.senses || []) {
        for (const tag of sense.tags || []) {
            allTags.add(tag);
        }
    }

    const forms = entry.forms?.map((f) => ({ form: f.form, tags: f.tags }));
    const uniqueForms: WordForm[] = [];
    for (const form of forms || []) {
        for (const tag of form.tags || []) {
            allTags.add(tag);
        }

        if (!uniqueForms.some((f) => f.form === form.form)) {
            uniqueForms.push(form);
            continue;
        }

        // If form already exists, merge tags
        const existingIndex = uniqueForms.findIndex(
            (f) => f.form === form.form,
        );
        if (existingIndex !== -1) {
            uniqueForms[existingIndex].tags = Array.from(
                new Set([
                    ...(uniqueForms[existingIndex].tags || []),
                    ...(form.tags || []),
                ]),
            );
        }
    }

    // Calculate rarity
    const rarity = calculateRarity(entry, frequencyMap, maxRank);

    // Build Word object
    const word: Word = {
        id: generateWordId(entry.word, entry.pos),
        lang: wiktionaryLang,
        word: entry.word,
        partOfSpeech: [mapPartOfSpeech(entry.pos, entry.pos_title, langCode)],
        definitions,
        etymologies,
        pronunciations:
            pronunciations && pronunciations.length > 0
                ? dedupArray(pronunciations)
                : undefined,
        synonyms: Array.from(new Set(entry.synonyms?.map((s) => s.word))),
        antonyms: Array.from(new Set(entry.antonyms?.map((a) => a.word))),
        related: Array.from(new Set(entry.related?.map((r) => r.word))),
        forms: uniqueForms && uniqueForms.length > 0 ? uniqueForms : undefined,
        categories: entry.categories,
        tags: allTags.size > 0 ? Array.from(allTags) : undefined,
        rarity: rarity.score,
        rarityMap: rarity.map,
        rand: Math.random(),
        source: "wiktionary",
        license: "CC BY-SA 4.0",
        url: `https://${wiktionaryLang}.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`,
        createdAt: now,
    };

    return word;
}

export const isWord = (w: unknown): w is Word => {
    if (!w) return false;
    return (
        typeof w === "object" &&
        Object.keys(w).includes("id") &&
        Object.keys(w).includes("lang") &&
        Object.keys(w).includes("word") &&
        Object.keys(w).includes("rarity")
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
        !Array.isArray(candidateRecord.definitions) ||
        candidateRecord.definitions.length === 0
    ) {
        missingFields.push("definitions");
    }

    if (
        !Array.isArray(candidateRecord.etymologies) ||
        candidateRecord.etymologies.length === 0
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

export function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }

    if (value !== null && typeof value === "object") {
        const keys = Object.keys(value).sort();
        return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify((value as any)[key])}`).join(",")}}`;
    }

    return JSON.stringify(value);
}

export function deterministicDocumentId(entry: Word): string {
    if (typeof entry.id === "string" && entry.id) {
        return entry.id;
    }

    const base = stableStringify({
        lang: getEntryLang(entry) ?? "",
        word: entry.word ?? "",
        definitions: entry.definitions ?? [],
    });

    return crypto.createHash("sha1").update(base).digest("hex");
}

export const mergeWords = (w1: Word, w2: Word) => {
    w1.partOfSpeech = Array.from(
        new Set([...w1.partOfSpeech, ...w2.partOfSpeech]),
    );

    // Merge definitions (deduplica per contenuto testuale)
    w1.definitions = dedupArray([...w1.definitions, ...w2.definitions], "text");

    // Merge etymologies (deduplica per testo)
    w1.etymologies = dedupArray(
        [...w1.etymologies, ...w2.etymologies],
        "text",
        "lang",
    );

    // Merge pronunciations (deduplica per IPA)
    w1.pronunciations = dedupArray([
        ...(w1.pronunciations || []),
        ...(w2.pronunciations || []),
    ]);

    // Merge synonyms/antonyms/related (deduplica stringhe)
    if (w2.synonyms) {
        w1.synonyms = Array.from(
            new Set([...(w1.synonyms || []), ...w2.synonyms]),
        );
    }
    if (w2.antonyms) {
        w1.antonyms = Array.from(
            new Set([...(w1.antonyms || []), ...w2.antonyms]),
        );
    }
    if (w2.related) {
        w1.related = Array.from(
            new Set([...(w1.related || []), ...w2.related]),
        );
    }

    w1.forms = dedupArray([...(w1.forms || []), ...(w2.forms || [])], "form");

    // Merge categories (deduplica stringhe)
    if (w2.categories) {
        w1.categories = Array.from(
            new Set([...(w1.categories || []), ...w2.categories]),
        );
    }

    // Merge tags (deduplica stringhe)
    if (w2.tags) {
        w1.tags = Array.from(new Set([...(w1.tags || []), ...w2.tags]));
    }

    // Update rarity (media pesata sul numero di definizioni)
    const existingWeight = w1.definitions.length;
    const newWeight = w2.definitions.length;
    const totalWeight = existingWeight + newWeight;
    w1.rarity = (w1.rarity + w2.rarity) / 2;

    return w1;
};

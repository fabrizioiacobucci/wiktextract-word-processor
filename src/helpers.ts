import { calculateRarity } from "./rarity.ts";
import {
    DEFAULT_FILTER_OPTIONS,
    filterOptions,
    LanguageCode,
    POS_MAPPING,
    SUPPORTED_LANGUAGE_CODES,
    toUTCDateString,
    WiktextractEntry,
    Word,
    WordForm,
} from "./types.ts";
import * as crypto from "node:crypto";

export function isStringEmpty(str: string): boolean {
    return str.replaceAll(/\W/gi, "").length === 0 || str.trim().length === 0;
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
        .replaceAll(/^[\s,]*/gi, "")
        .replaceAll(/([;,.:\-!?]+)\s?/gi, "$1 ")
        .trim();
}

export function getUniqueObjectsArray<T extends object>(
    array: T[],
    keyProp?: keyof T,
): T[] {
    if (array.length === 0) return [];

    if (keyProp) {
        const setObj = new Set(array.map((x) => x[keyProp]));
        setObj.forEach((value) => {
            const dups = array.filter((x) => x[keyProp] === value)!;
            if (dups.length > 1) {
                const merged = dups.reduce(
                    (acc, obj) => mergeObjects(acc, obj),
                    {} as T,
                );
                array = array.filter((x) => x[keyProp] !== value);
                array.push(merged);
            }
        });

        return array;
    }

    let setObj = new Set(array.map((x) => JSON.stringify(x)));
    return Array.from(setObj).map((x) => JSON.parse(x)) as T[];
}

function mergeObjects<T extends object>(obj1: T, obj2: T): T {
    const merged: T = { ...obj1 };

    for (const key in obj2) {
        const k = key as keyof T;
        if (Array.isArray(obj2[k]) && Array.isArray(merged[k])) {
            merged[k] = getUniqueObjectsArray([
                ...merged[k],
                ...obj2[k],
            ]) as T[Extract<keyof T, string>];
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

function isSupportedLanguageCode(value: string): value is LanguageCode {
    return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(value);
}

function parseSupportedLanguageCode(rawValue: string): LanguageCode {
    const normalized = rawValue.toLowerCase().trim();

    if (!isSupportedLanguageCode(normalized)) {
        throw new Error(
            `Codice lingua non supportato: ${rawValue}. Valori ammessi: ${SUPPORTED_LANGUAGE_CODES.join(", ")}`,
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
                : `Codice lingua non valido: ${value}`;
        console.error(`❌ ${message}`);
        process.exit(1);
    }
}

/**
 * Generates a unique ID for a word based on its text and part of speech
 */
function generateWordId(word: string, pos: string): string {
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
export function sanitizeWord(word: WiktextractEntry): WiktextractEntry {
    word.senses = word.senses?.map((sense) => {
        sense.glosses = sense.glosses?.map((gloss) => {
            return sanitizeString(gloss);
        });
        sense.glosses = sense.glosses?.filter((gloss) => gloss.length > 0);
        sense.examples = sense.examples?.map((example) => {
            example.text = sanitizeString(example.text);
            return example;
        });
        sense.examples = sense.examples?.filter(
            (example) => example.text.length > 0,
        );
        if (
            sense.glosses?.some((g) => g.trim().endsWith(":")) &&
            (!sense.examples || sense.examples?.length == 0)
        ) {
            sense.glosses = sense.glosses?.map((gloss) => {
                return gloss.substring(0, gloss.length - 1);
            });
        }
        return sense;
    });

    word.etymology_texts = word.etymology_texts?.map((etym) =>
        sanitizeString(etym),
    );
    word.etymology_texts = word.etymology_texts?.filter(
        (etym) => etym.length > 0,
    );

    word.synonyms = word.synonyms?.map((syn) => {
        syn.word = sanitizeString(syn.word, false);
        return syn;
    });
    word.synonyms = word.synonyms?.filter((syn) => syn.word.length > 0);

    word.antonyms = word.antonyms?.map((ant) => {
        ant.word = sanitizeString(ant.word, false);
        return ant;
    });
    word.antonyms = word.antonyms?.filter((ant) => ant.word.length > 0);

    return word;
}

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
    // Filter Treccani references
    if (
        options.filterExternalSources &&
        options.customExternalSources?.some((source) =>
            JSON.stringify(entry).toLowerCase().includes(source.toLowerCase()),
        )
    ) {
        return true;
    }

    // Must match target language
    if (entry.lang_code !== langCode) {
        return true;
    }

    // Must have senses (definitions)
    if (
        options.filterMissingDefinitions &&
        (!entry.senses || entry.senses.length === 0)
    ) {
        return true;
    }

    // Filter entries with missing definitions
    if (options.filterMissingDefinitions) {
        if (
            options.customDefinitionPlaceholders?.some((placeholder) =>
                entry.senses?.some(
                    (sense) =>
                        sense.glosses &&
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
): Word {
    const now = toUTCDateString(new Date());
    const wiktionaryLang = langCode;

    // Map definitions
    const definitions = (entry.senses || []).map((sense) => ({
        text: sense.glosses?.[0] || "",
        examples: sense.examples?.map((ex) => ex.text) || [],
        tags: sense.tags || [],
        topics: sense.categories || [],
    }));

    // Map etymologies
    const etymologies = entry.etymology_texts!.map((text, index) => ({
        text: text.trim(),
        number:
            entry.etymology_number ||
            (entry.etymology_texts!.length > 1 ? index + 1 : undefined),
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
    const rarity = calculateRarity(entry, frequencyMap);

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
                ? getUniqueObjectsArray(pronunciations)
                : undefined,
        synonyms: Array.from(new Set(entry.synonyms?.map((s) => s.word))),
        antonyms: Array.from(new Set(entry.antonyms?.map((a) => a.word))),
        related: Array.from(new Set(entry.related?.map((r) => r.word))),
        forms: uniqueForms && uniqueForms.length > 0 ? uniqueForms : undefined,
        categories: entry.categories,
        tags: allTags.size > 0 ? Array.from(allTags) : undefined,
        rarity,
        rand: Math.random(),
        source: "wiktionary",
        license: "CC BY-SA 4.0",
        url: `https://${wiktionaryLang}.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`,
        createdAt: now,
    };

    return word;
}

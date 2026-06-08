import { calculateRarity } from "./rarity";
import { LanguageCode, toUTCDateString } from "../types/generic.types";
import {
    ParsableEntry,
    PART_OF_SPEECH,
    POS_LABELS,
    TAG_LABELS,
    TAGS,
    TOPIC_LABELS,
    TOPICS,
    type TopicKey,
} from "../types/word.types";
import {
    WiktextractEntry,
    Word,
    TagsMetadata,
    TopicsMetadata,
    TagKey,
    PosKey,
    CategoryLabels,
    CATEGORIES,
} from "../types/word.types";
import { isWord } from "./word";

const isTagKey = (k: string): k is TagKey => k in TAGS;
const isTopicKey = (k: string): k is TopicKey => k in TOPICS;
const isPosKey = (k: string): k is PosKey => k in PART_OF_SPEECH;
const isCategoryLabel = (
    k: string,
    langId: keyof typeof CATEGORIES,
): k is CategoryLabels<typeof langId> => k in CATEGORIES[langId];

export function parseTags<T extends { tags?: string[] }>(
    raw: T,
    lang_id: LanguageCode,
): T & TagsMetadata {
    const known = (raw.tags ?? []).filter((t: string) => isTagKey(t));
    const labels = known.map((t) => TAG_LABELS[lang_id]?.[t as TagKey]);

    return {
        ...raw,
        tags: known,
        unknown_tags: (raw.tags ?? []).filter((t: string) => !isTagKey(t)),
        tag_labels: labels.filter((l) => l !== undefined),
    };
}

export function parseTopics<T extends { topics?: string[] }>(
    raw: T,
    lang_id: LanguageCode,
): T & TopicsMetadata {
    const known = (raw.topics ?? []).filter((t: string) => isTopicKey(t));
    const labels = known.map((t) => TOPIC_LABELS[lang_id]?.[t as TopicKey]);

    return {
        ...raw,
        topics: known,
        unknown_topics: (raw.topics ?? []).filter(
            (t: string) => !isTopicKey(t),
        ),
        tag_labels: labels.filter((l) => l !== undefined),
    };
}

export function parseSense(
    raw: {
        tags?: string[];
        topics?: string[];
        categories?: string[];
        examples?: { tags?: string[] }[];
    },
    lang_id: LanguageCode,
) {
    const examples = (raw.examples ?? []).map((e) => parseTags(e, lang_id));

    const parsed = parseCategories(
        parseTopics(parseTags(raw, lang_id), lang_id),
        lang_id as keyof typeof CATEGORIES,
    );

    return {
        ...parsed,
        examples: examples,
    };
}

export function parsePos<T extends { pos: string[]; pos_title: string[] }>(
    raw: T,
    lang_id: LanguageCode,
): T {
    return {
        ...raw,
        pos_title: raw.pos.map((p) => POS_LABELS[lang_id]?.[p as PosKey]),
    };
}

export function parseCategories<T extends { categories?: string[] }>(
    raw: T,
    lang_id: keyof typeof CATEGORIES,
): T {
    const regex = new RegExp("-" + lang_id + "$", "i");
    const known = (raw.categories ?? []).filter((t: string) =>
        isCategoryLabel(t, lang_id),
    );

    return {
        ...raw,
        category_labels: known.map((c) =>
            c.replace(regex, "").replaceAll("_", " "),
        ),
        unknown_categories: raw.categories?.filter(
            (c) => !known.includes(c as CategoryLabels<typeof lang_id>),
        ),
    };
}

export function parseEntry(
    raw: WiktextractEntry | Word,
    langCode: LanguageCode,
    frequencyMap?: Map<string, number>,
    maxRank?: number,
): Word {
    const now = toUTCDateString(new Date());

    const parsed = basicParsing(raw, langCode);

    if (!isWord(raw)) {
        let rarity = null;
        if (frequencyMap && maxRank)
            rarity = calculateRarity(raw, frequencyMap, maxRank);

        return {
            ...raw,
            ...(parsed as Word),
            row_id: 0,

            pos: [(parsed as WiktextractEntry).pos],
            pos_title: [(parsed as WiktextractEntry).pos_title],

            rarity: rarity?.score ?? 0,
            rarityMap: rarity?.map ?? {},
            rand: Math.random(),
            source: "wiktionary",
            license: "CC BY-SA 4.0",
            url: `https://${langCode}.wiktionary.org/wiki/${encodeURIComponent(raw.word)}`,
            created_at_utc: now,
            updated_at_utc: now,
        };
    }

    const posParsed = parsePos(parsed as Word, langCode);

    return posParsed;
}

export function basicParsing(raw: ParsableEntry, langCode: LanguageCode) {
    const parsed = parseCategories(
        parseTags(raw, langCode),
        langCode as keyof typeof CATEGORIES,
    );

    return {
        ...parsed,
        senses: (parsed.senses ?? []).map((s) => parseSense(s, langCode)),
        sounds: (parsed.sounds ?? []).map((x) => parseTags(x, langCode)),
        translations: (parsed.translations ?? []).map((x) =>
            parseTags(x, langCode),
        ),
        forms: (parsed.forms ?? []).map((x) => parseTags(x, langCode)),
        synonyms: (parsed.synonyms ?? []).map((x) => parseTags(x, langCode)),
        derived: (parsed.derived ?? []).map((x) => parseTags(x, langCode)),
        related: (parsed.related ?? []).map((x) => parseTags(x, langCode)),
        hypernyms: (parsed.hypernyms ?? []).map((x) => parseTags(x, langCode)),
        antonyms: (parsed.antonyms ?? []).map((x) => parseTags(x, langCode)),
        hyponyms: (parsed.hyponyms ?? []).map((x) => parseTags(x, langCode)),
    };
}

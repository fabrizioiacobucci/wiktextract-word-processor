import { calculateRarity } from "./rarity";
import { LanguageCode, toUTCDateString } from "../types/generic.types";
import {
    PART_OF_SPEECH,
    POS_LABELS,
    TAG_LABELS,
    TAGS,
    TOPIC_LABELS,
    TOPICS,
    type TopicKey,
} from "../types/word.types";
import type {
    WiktextractEntry,
    RawSense,
    Word,
    ParsedSense,
    ParsedSenseExample,
    TagsMetadata,
    TopicsMetadata,
    TagKey,
    PosKey,
} from "../types/word.types";
import { generateWordId } from "./word";

const isTagKey = (k: string): k is TagKey => k in TAGS;
const isTopicKey = (k: string): k is TopicKey => k in TOPICS;
const isPosKey = (k: string): k is PosKey => k in PART_OF_SPEECH;

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

export function parseSense(raw: RawSense, lang_id: LanguageCode): ParsedSense {
    const examples: ParsedSenseExample[] = (raw.examples ?? []).map((e) =>
        parseTags(e, lang_id),
    );

    const parsed = parseTopics(parseTags(raw, lang_id), lang_id);

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

export function parseEntry(
    raw: WiktextractEntry,
    langCode: LanguageCode,
    frequencyMap: Map<string, number> | undefined,
    maxRank: number,
): Word {
    const now = toUTCDateString(new Date());
    const rarity = calculateRarity(raw, frequencyMap, maxRank);
    const parsed = parseTags(raw, langCode);

    return {
        ...parsed,
        id: generateWordId(raw.word, raw.pos),
        lang: langCode,

        pos: [parsed.pos],
        pos_title: [parsed.pos_title],

        senses: (raw.senses ?? []).map((s) => parseSense(s, langCode)),
        sounds: (raw.sounds ?? []).map((x) => parseTags(x, langCode)),
        translations: (raw.translations ?? []).map((x) =>
            parseTags(x, langCode),
        ),
        forms: (raw.forms ?? []).map((x) => parseTags(x, langCode)),
        synonyms: (raw.synonyms ?? []).map((x) => parseTags(x, langCode)),
        derived: (raw.derived ?? []).map((x) => parseTags(x, langCode)),
        related: (raw.related ?? []).map((x) => parseTags(x, langCode)),
        hypernyms: (raw.hypernyms ?? []).map((x) => parseTags(x, langCode)),
        antonyms: (raw.antonyms ?? []).map((x) => parseTags(x, langCode)),
        hyponyms: (raw.hyponyms ?? []).map((x) => parseTags(x, langCode)),

        rarity: rarity.score,
        rarityMap: rarity.map,
        rand: Math.random(),
        source: "wiktionary",
        license: "CC BY-SA 4.0",
        url: `https://${langCode}.wiktionary.org/wiki/${encodeURIComponent(raw.word)}`,
        created_at_utc: now,
    };
}

import { calculateRarity } from "./rarity";
import { LanguageCode, toUTCDateString } from "../types/generic.types";
import { type TagKey, TAGS, TOPICS, type TopicKey } from "../types/word.types";
import type {
    WiktextractEntry,
    RawSense,
    Word,
    ParsedSense,
    ParsedSenseExample,
    UnknownTopics,
    UnknownTags,
} from "../types/word.types";
import { generateWordId } from "./word";

const isTagKey = (k: string): k is TagKey => k in TAGS;
const isTopicKey = (k: string): k is TopicKey => k in TOPICS;

function parseTags<T extends { tags?: string[] }>(raw: T): T & UnknownTags {
    return {
        ...raw,
        tags: (raw.tags ?? []).filter((t: string) => isTagKey(t)),
        unknown_tags: (raw.tags ?? []).filter((t: string) => !isTagKey(t)),
    };
}

function parseTopics<T extends { topics?: string[] }>(
    raw: T,
): T & UnknownTopics {
    return {
        ...raw,
        topics: (raw.topics ?? []).filter((t: string) => isTopicKey(t)),
        unknown_topics: (raw.topics ?? []).filter(
            (t: string) => !isTopicKey(t),
        ),
    };
}

function parseSense(raw: RawSense): ParsedSense {
    const examples: ParsedSenseExample[] = (raw.examples ?? []).map(parseTags);

    const parsed = parseTopics(parseTags(raw));

    return {
        ...parsed,
        examples: examples,
        tagLabels: (parsed.tags ?? []).map((k) => TAGS[k]),
        topicLabels: (parsed.topics ?? []).map((k) => TOPICS[k]),
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
    const parsed = parseTags(raw);

    return {
        ...parsed,
        id: generateWordId(raw.word, raw.pos),
        lang: langCode,

        pos: [parsed.pos],
        pos_title: [parsed.pos_title],

        senses: (raw.senses ?? []).map(parseSense),
        sounds: (raw.sounds ?? []).map(parseTags),
        translations: (raw.translations ?? []).map(parseTags),
        forms: (raw.forms ?? []).map(parseTags),
        synonyms: (raw.synonyms ?? []).map(parseTags),
        derived: (raw.derived ?? []).map(parseTags),
        related: (raw.related ?? []).map(parseTags),
        hypernyms: (raw.hypernyms ?? []).map(parseTags),
        antonyms: (raw.antonyms ?? []).map(parseTags),
        hyponyms: (raw.hyponyms ?? []).map(parseTags),

        rarity: rarity.score,
        rarityMap: rarity.map,
        rand: Math.random(),
        source: "wiktionary",
        license: "CC BY-SA 4.0",
        url: `https://${langCode}.wiktionary.org/wiki/${encodeURIComponent(raw.word)}`,
        created_at_utc: now,
    };
}

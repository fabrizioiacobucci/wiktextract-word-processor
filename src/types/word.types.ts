import { ISODateString } from "./generic.types";

export type PART_OF_SPEECH =
    | "noun"
    | "verb"
    | "adj"
    | "adv"
    | "name"
    | "prefix"
    | "suffix"
    | "intj"
    | "contraction"
    | "character"
    | "proverb"
    | "phrase"
    | "prep"
    | "conj"
    | "pron"
    | "det"
    | "article"
    | "num"
    | "unknown"
    | "abbrev"
    | "adj_noun"
    | "adv_phrase"
    | "particle"
    | "classifier"
    | "symbol"
    | "prep_phrase"
    | "punct"
    | "postp"
    | "affix";

export const TAGS: Readonly<Record<string, string>> = {
    abbreviation: "abbreviazione",
    ablative: "ablativo",
    absolute: "assoluto",
    accusative: "accusativo",
    active: "attivo",
    adjective: "aggettivo",
    archaic: "arcaico",
    augmentative: "accrescitivo",
    auxiliary: "ausiliare",
    broadly: "in senso lato",
    class: "classe",
    collective: "collettivo",
    colloquial: "colloquiale",
    common: "comune",
    comparative: "comparativo",
    conjunctive: "congiuntivo",
    dative: "dativo",
    demonstrative: "dimostrativo",
    deponent: "deponente",
    diminutive: "diminutivo",
    endearing: "vezzeggiativo",
    especially: "in particolare",
    feminine: "femminile",
    figuratively: "in senso figurato",
    "first-person": "prima persona",
    "form-of": "forma di",
    formal: "formale",
    future: "futuro",
    genitive: "genitivo",
    gerund: "gerundio",
    hanzi: "hanzi",
    hiragana: "hiragana",
    historic: "storico",
    imperative: "imperativo",
    imperfect: "imperfetto",
    "in-plural": "al plurale",
    indefinite: "indefinito",
    infinitive: "infinito",
    informal: "informale",
    interjection: "interiezione",
    interrogative: "interrogativo",
    intransitive: "intransitivo",
    invariable: "invariabile",
    kanji: "kanji",
    katakana: "katakana",
    letter: "lettera",
    literally: "letteralmente",
    literary: "letterario",
    masculine: "maschile",
    morpheme: "morfema",
    neologism: "neologismo",
    neuter: "neutro",
    "no-gloss": "senza glossa",
    nominative: "nominativo",
    noun: "sostantivo",
    numeral: "numerale",
    obsolete: "obsoleto",
    offensive: "offensivo",
    paradigm: "paradigma",
    participle: "participio",
    passive: "passivo",
    past: "passato",
    "past-remote": "passato remoto",
    pejorative: "dispregiativo", // ← corretto da "peggiorativo"
    perfect: "perfetto",
    person: "persona",
    pluperfect: "trapassato prossimo",
    plural: "plurale",
    positive: "positivo",
    possessive: "possessivo",
    present: "presente",
    pronominal: "pronominale",
    punctuation: "punteggiatura",
    rare: "raro",
    reciprocal: "reciproco",
    reflexive: "riflessivo",
    regional: "regionale",
    relative: "relativo",
    rōmaji: "rōmaji",
    "second-person": "seconda persona",
    singular: "singolare",
    slang: "gergale",
    superlative: "superlativo",
    supine: "supino",
    "third-person": "terza persona",
    toponymic: "toponimico",
    transcription: "trascrizione",
    transitive: "transitivo",
    verb: "verbo",
    vulgar: "volgare",
} as const;
export type TagKey = keyof typeof TAGS;
export const TagKeys = Object.keys(TAGS) as TagKey[];
export type TagLabel = (typeof TAGS)[TagKey];

export const TOPICS: Readonly<Record<string, string>> = {
    aeronautics: "aeronautica",
    agriculture: "agricoltura",
    algebra: "algebra",
    anatomy: "anatomia",
    anthropology: "antropologia",
    archaeology: "archeologia",
    architecture: "architettura",
    arithmetic: "aritmetica",
    arts: "arti",
    astrology: "astrologia",
    astronomy: "astronomia",
    biochemistry: "biochimica",
    biology: "biologia",
    biotechnology: "biotecnologia",
    botany: "botanica",
    "card-games": "giochi di carte",
    carpentry: "falegnameria",
    chemistry: "chimica",
    chess: "scacchi",
    christianity: "cristianesimo",
    cinematography: "cinematografia",
    clothing: "abbigliamento",
    color: "colore",
    commerce: "commercio",
    construction: "edilizia",
    dance: "danza",
    ecclesiastical: "ecclesiastico",
    ecology: "ecologia",
    economics: "economia",
    "electrical-engineering": "ingegneria elettrica",
    electronics: "elettronica",
    engineering: "ingegneria",
    entomology: "entomologia",
    equitation: "equitazione",
    ethnology: "etnologia",
    fashion: "moda",
    finance: "finanza",
    games: "giochi",
    genetics: "genetica",
    geography: "geografia",
    geology: "geologia",
    geometry: "geometria",
    grammar: "grammatica",
    heraldry: "araldica",
    herpetology: "erpetologia",
    history: "storia",
    hydraulics: "idraulica",
    ichthyology: "ittiologia",
    informatics: "informatica",
    internet: "internet",
    journalism: "giornalismo",
    law: "diritto",
    linguistics: "linguistica",
    literature: "letteratura",
    malacology: "malacologia",
    mammalogy: "mammalogia",
    mathematics: "matematica",
    mechanics: "meccanica",
    medicine: "medicina",
    metallurgy: "metallurgia",
    meteorology: "meteorologia",
    military: "militare",
    mineralogy: "mineralogia",
    music: "musica",
    mythology: "mitologia",
    navy: "marina",
    numismatics: "numismatica",
    ornithology: "ornitologia",
    paleontology: "paleontologia",
    pharmacology: "farmacologia",
    philosophy: "filosofia",
    phonology: "fonologia",
    photography: "fotografia",
    physics: "fisica",
    physiology: "fisiologia",
    poetry: "poesia",
    politics: "politica",
    psychiatry: "psichiatria",
    psychoanalysis: "psicoanalisi",
    psychology: "psicologia",
    railways: "ferrovie",
    religion: "religione",
    sexuality: "sessualità",
    soccer: "calcio",
    sociology: "sociologia",
    sports: "sport",
    statistics: "statistica",
    surgery: "chirurgia",
    technology: "tecnologia",
    telecommunications: "telecomunicazioni",
    textiles: "tessile",
    theater: "teatro",
    topography: "topografia",
    typography: "tipografia",
    veterinary: "veterinaria",
    weaponry: "armamento",
    zoology: "zoologia",
} as const;

export type TopicKey = keyof typeof TOPICS;
export const TopicKeys = Object.keys(TOPICS) as TopicKey[];
export type TopicLabel = (typeof TOPICS)[TopicKey];

export const SemanticRelations = [
    "synonym",
    "derived",
    "related",
    "hypernym",
    "antonym",
    "hyponym",
] as const;
export type SemanticRelation = (typeof SemanticRelations)[number];

export interface UnknownTags {
    unknown_tags?: string[];
}

export interface UnknownTopics {
    unknown_topics?: string[];
}

export interface RawSenseExample {
    text: string;
    bold_text_offsets?: [number[]];
    translation?: string;
    ref?: string;
    roman?: string;
    bold_roman_offsets?: [number[]];
    bold_translation_offsets?: [number[]];
    tags?: string[];
}

export interface ParsedSenseExample extends RawSenseExample, UnknownTags {}

interface SenseForm {
    word: string;
}

export interface RawSense {
    glosses: string[];
    raw_tags?: string[];
    tags?: string[];
    form_of?: SenseForm[];
    examples?: RawSenseExample[];
    categories?: string[];
    topics?: string[];
}

export interface ParsedSense
    extends UnknownTags, UnknownTopics, Omit<RawSense, "examples"> {
    examples: ParsedSenseExample[];
    tagLabels: string[]; // es. ["arcaico", "intransitivo"]
    topicLabels: string[]; // es. ["botanica", "medicina"]
}

export interface RawTranslation {
    lang_code: string;
    lang: string;
    word: string;
    sense: string;
    roman: string;
    tags: string[];
    raw_tags: string[];
}

export interface ParsedTranslation extends RawTranslation, UnknownTags {}

interface Hyphenation {
    parts: string[];
    sense?: string;
}

export interface RawSound {
    ipa: string;
    sense?: string;
    audio?: string;
    ogg_url?: string;
    mp3_url?: string;
    raw_tags?: string[];
    wav_url?: string;
    oga_url?: string;
    opus_url?: string;
    tags?: string[];
    flac_url?: string;
}

export interface ParsedSound extends RawSound, UnknownTags {}

export interface RawSemanticRelation {
    word: string;
    raw_tags: string[];
    tags: string[];
}

export interface ParsedSemanticRelation
    extends RawSemanticRelation, UnknownTags {}

interface Proverb {
    word: string;
    sense: string;
}

export interface RawForm {
    form: string;
    tags?: string[];
    raw_tags?: string[];
    source?: string;
}

export interface ParsedForm extends RawForm, UnknownTags {}

export interface WiktextractEntry {
    word: string;
    lang_code: string;
    lang: string;

    pos: string;
    pos_title: string;
    senses?: RawSense[];
    etymology_texts?: string[];
    forms?: RawForm[];
    hyphenations?: Hyphenation[];
    sounds?: RawSound[];
    tags?: string[];
    categories?: string[];
    raw_tags?: string[];
    proverbs?: Proverb[];
    translations?: RawTranslation[];

    synonyms?: RawSemanticRelation[];
    derived?: RawSemanticRelation[];
    related?: RawSemanticRelation[];
    hypernyms?: RawSemanticRelation[];
    antonyms?: RawSemanticRelation[];
    hyponyms?: RawSemanticRelation[];

    notes?: string[];
    title?: string;
    redirect?: string;
}

export interface Word
    extends Omit<WiktextractEntry, "pos" | "pos_title" | "title">, UnknownTags {
    // === BASE FIELDS ===
    id: string;

    pos: string[];
    pos_title: string[];

    senses: ParsedSense[];
    translations?: ParsedTranslation[];
    sounds?: ParsedSound[];
    forms?: ParsedForm[];
    synonyms?: ParsedSemanticRelation[];
    derived?: ParsedSemanticRelation[];
    related?: ParsedSemanticRelation[];
    hypernyms?: ParsedSemanticRelation[];
    antonyms?: ParsedSemanticRelation[];
    hyponyms?: ParsedSemanticRelation[];

    // === METADATA ===
    rarity: number; // 1-100
    rarityMap: object;
    rand: number; // 0-1 for random sampling

    // === ATTRIBUTION ===
    source: "wiktionary";
    license: string; // "CC BY-SA 4.0"
    url: string;

    // === TIMESTAMPS ===
    created_at_utc: ISODateString; // When document was created in Supabase
    updated_at_utc?: ISODateString; // Last update timestamp
}

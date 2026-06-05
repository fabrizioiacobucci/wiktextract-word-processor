import { ISODateString, LanguageCode } from "./generic.types";

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

export const TAGS = [
    "abbreviation",
    "ablative",
    "absolute",
    "accusative",
    "active",
    "adjective",
    "archaic",
    "augmentative",
    "auxiliary",
    "broadly",
    "class",
    "collective",
    "colloquial",
    "common",
    "comparative",
    "conjunctive",
    "dative",
    "demonstrative",
    "deponent",
    "diminutive",
    "endearing",
    "especially",
    "feminine",
    "figuratively",
    "first-person",
    "form-of",
    "formal",
    "future",
    "genitive",
    "gerund",
    "hanzi",
    "hiragana",
    "historic",
    "imperative",
    "imperfect",
    "in-plural",
    "indefinite",
    "infinitive",
    "informal",
    "interjection",
    "interrogative",
    "intransitive",
    "invariable",
    "kanji",
    "katakana",
    "letter",
    "literally",
    "literary",
    "masculine",
    "morpheme",
    "neologism",
    "neuter",
    "no-gloss",
    "nominative",
    "noun",
    "numeral",
    "obsolete",
    "offensive",
    "paradigm",
    "participle",
    "passive",
    "past",
    "past-remote",
    "pejorative",
    "perfect",
    "person",
    "pluperfect",
    "plural",
    "positive",
    "possessive",
    "present",
    "pronominal",
    "punctuation",
    "rare",
    "reciprocal",
    "reflexive",
    "regional",
    "relative",
    "rōmaji",
    "second-person",
    "singular",
    "slang",
    "superlative",
    "supine",
    "third-person",
    "toponymic",
    "transcription",
    "transitive",
    "verb",
    "vulgar",
] as const;
export type TagKey = (typeof TAGS)[number];

export const TOPICS = [
    "aeronautics",
    "agriculture",
    "algebra",
    "anatomy",
    "anthropology",
    "archaeology",
    "architecture",
    "arithmetic",
    "arts",
    "astrology",
    "astronomy",
    "biochemistry",
    "biology",
    "biotechnology",
    "botany",
    "card-games",
    "carpentry",
    "chemistry",
    "chess",
    "christianity",
    "cinematography",
    "clothing",
    "color",
    "commerce",
    "construction",
    "dance",
    "ecclesiastical",
    "ecology",
    "economics",
    "electrical-engineering",
    "electronics",
    "engineering",
    "entomology",
    "equitation",
    "ethnology",
    "fashion",
    "finance",
    "games",
    "genetics",
    "geography",
    "geology",
    "geometry",
    "grammar",
    "heraldry",
    "herpetology",
    "history",
    "hydraulics",
    "ichthyology",
    "informatics",
    "internet",
    "journalism",
    "law",
    "linguistics",
    "literature",
    "malacology",
    "mammalogy",
    "mathematics",
    "mechanics",
    "medicine",
    "metallurgy",
    "meteorology",
    "military",
    "mineralogy",
    "music",
    "mythology",
    "navy",
    "numismatics",
    "ornithology",
    "paleontology",
    "pharmacology",
    "philosophy",
    "phonology",
    "photography",
    "physics",
    "physiology",
    "poetry",
    "politics",
    "psychiatry",
    "psychoanalysis",
    "psychology",
    "railways",
    "religion",
    "sexuality",
    "soccer",
    "sociology",
    "sports",
    "statistics",
    "surgery",
    "technology",
    "telecommunications",
    "textiles",
    "theater",
    "topography",
    "typography",
    "veterinary",
    "weaponry",
    "zoology",
] as const;
export type TopicKey = (typeof TOPICS)[number];

export const TAG_LABELS: {
    [lang in LanguageCode]?: { [key in TagKey]?: string };
} = {
    it: {
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
        pejorative: "dispregiativo",
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
    },
} as const;

export const TOPIC_LABELS: {
    [lang in LanguageCode]?: { [key in TopicKey]?: string };
} = {
    it: {
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
    },
} as const;

export const SemanticRelations = [
    "synonym",
    "derived",
    "related",
    "hypernym",
    "antonym",
    "hyponym",
] as const;
export type SemanticRelation = (typeof SemanticRelations)[number];

export interface TagsMetadata {
    tag_labels?: string[];
    unknown_tags?: string[];
}

export interface TopicsMetadata {
    topic_labels?: string[];
    unknown_topics?: string[];
}

export type Offset = [number, number];

export interface RawSenseExample {
    text: string;
    bold_text_offsets?: Offset[];
    translation?: string;
    ref?: string;
    roman?: string;
    bold_roman_offsets?: Offset[];
    bold_translation_offsets?: Offset[];
    tags?: string[];
}

export interface ParsedSenseExample extends RawSenseExample, TagsMetadata {}

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
    extends TagsMetadata, TopicsMetadata, Omit<RawSense, "examples"> {
    examples: ParsedSenseExample[];
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

export interface ParsedTranslation extends RawTranslation, TagsMetadata {}

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

export interface ParsedSound extends RawSound, TagsMetadata {}

export interface RawSemanticRelation {
    word: string;
    raw_tags: string[];
    tags: string[];
}

export interface ParsedSemanticRelation
    extends RawSemanticRelation, TagsMetadata {}

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

export interface ParsedForm extends RawForm, TagsMetadata {}

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
    extends
        Omit<WiktextractEntry, "pos" | "pos_title" | "title">,
        TagsMetadata {
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

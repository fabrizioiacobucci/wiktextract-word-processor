export const EXTERNAL_SOURCES = ["treccani"] as const;
export const FILTER_DEFINITION = ["definizione mancante"] as const;
export const FILTER_ETYMOLOGY_CONTENT = [
    "etimologia mancante",
    "vedi",
    "vedasi",
] as const;
export const FILTER_ETYMOLOGY_LENGTH = 40; // Minimum length for etymology texts
export const FILTER_POS = [
    "voce verbale",
    "forma flessa",
    "possessivo",
    "avverbio",
    "pronome",
    "lettera",
    "nome proprio",
] as const;

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

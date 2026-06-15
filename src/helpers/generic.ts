export function isStringEmpty(str: string): boolean {
    return !str || str.replaceAll(/\W/gi, "").trim().length === 0;
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

export type DedupOptions = {
    caseSensitive?: boolean;
};

export function dedupArray<T>(array: T[], options?: DedupOptions): T[];
export function dedupArray<T, K extends keyof T>(array: T[], firstKey: K, ...restKeys: K[]): T[];
export function dedupArray<T, K extends keyof T>(array: T[], options: DedupOptions, ...keyProp: K[]): T[];
export function dedupArray<T, K extends keyof T>(
    array: T[],
    optionsOrKey?: DedupOptions | K,
    ...rest: K[]
): T[] {
    if (!array || array.length === 0) return array;

    let options: DedupOptions = {};
    let keyProp: K[] = [];

    if (optionsOrKey !== undefined && optionsOrKey !== null && typeof optionsOrKey === "object") {
        options = optionsOrKey as DedupOptions;
        keyProp = rest;
    } else if (optionsOrKey !== undefined) {
        keyProp = [optionsOrKey as K, ...rest];
    }

    const caseSensitive = options.caseSensitive !== false;

    // ASCII control chars: never appear unescaped in stableStringify output
    const PROP_SEP = "\x01";
    const UNDEF = "\x02";

    const serializeForKey = (val: unknown): string => {
        if (val === undefined) return UNDEF;
        const s = stableStringify(val);
        return caseSensitive ? s : s.toLowerCase();
    };

    if (keyProp.length > 0) {
        const seen = new Set<string>();
        const result: T[] = [];
        for (const el of array) {
            if (el === null || el === undefined) {
                const sentinel = el === null ? "null" : UNDEF;
                if (!seen.has(sentinel)) {
                    seen.add(sentinel);
                    result.push(el);
                }
                continue;
            }
            const key = keyProp.map((p) => serializeForKey(el[p])).join(PROP_SEP);
            if (!seen.has(key)) {
                seen.add(key);
                result.push(el);
            }
        }
        return result;
    }

    const seen = new Set<string>();
    const result: T[] = [];
    for (const x of array) {
        if (x === undefined) {
            if (!seen.has(UNDEF)) {
                seen.add(UNDEF);
                result.push(x);
            }
            continue;
        }
        const key =
            typeof x === "string" && !caseSensitive
                ? JSON.stringify(x.toLowerCase())
                : stableStringify(x);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(x);
        }
    }
    return result;
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

export function omit<T extends { [k: string]: any }, K extends string>(
    obj: T,
    ...props: K[]
): Omit<T, K> {
    const result = { ...obj };
    props.forEach(function (prop) {
        if (prop in result) delete result[prop];
    });
    return result;
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

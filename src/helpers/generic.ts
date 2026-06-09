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

export function dedupArray<T, K extends keyof T>(
    array: T[],
    options: any = { caseSensitive: true },
    ...keyProp: K[]
): T[] {
    if (!array || array.length === 0) return array;

    const getKey = (element: T, props: K[]) => {
        const propsValue = [];
        for (const p of props) {
            propsValue.push(JSON.stringify(element[p]));
        }

        return propsValue.join("|").replaceAll(/\s/gi, "");
    };

    if (keyProp && keyProp.length > 0 && typeof array[0] === "object") {
        const result: T[] = [];
        for (const el of array) {
            if (
                options.caseSensitive &&
                result.find((e) => getKey(e, keyProp) === getKey(el, keyProp))
            )
                continue;

            if (
                !options.caseSensitive &&
                result.find((e) => getKey(e, keyProp) == getKey(el, keyProp))
            )
                continue;

            result.push(el);
        }

        return result;
    }

    const stringified = array.map((x) => JSON.stringify(x));
    let setObj = options.caseSensitive
        ? new Set(stringified)
        : stringified.filter(
              (x) => stringified.filter((y) => x === y).length == 1,
          );
    return Array.from(setObj).map((x) => JSON.parse(x ?? {})) as T[];
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

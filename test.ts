import { dedupArray } from "./src/helpers/generic";

const array = ["Meccanica", "meccanica", "Aritmetica", "aritmetica"];

console.log(dedupArray(array, { caseSensitive: false }));

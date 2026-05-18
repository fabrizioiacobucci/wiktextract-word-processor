# pip install wordfreq
# usage: python src/scripts/wordfreq-export.py words.txt wordfreq_it.txt
#
# Reads a word list (one word per line) and outputs "word fpm" sorted by fpm desc.
# fpm = frequency per million tokens, as reported by wordfreq for Italian.

import sys

from wordfreq import word_frequency


def main():
    if len(sys.argv) != 3:
        print("usage: python wordfreq-export.py <words_file> <output_file>", file=sys.stderr)
        sys.exit(1)

    words_file, output_file = sys.argv[1], sys.argv[2]

    with open(words_file, encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]

    results = [(w, word_frequency(w, "it") * 1_000_000) for w in words]
    results = [(w, fpm) for w, fpm in results if fpm > 0]
    results.sort(key=lambda x: -x[1])

    with open(output_file, "w", encoding="utf-8") as out:
        for word, fpm in results:
            out.write(f"{word} {fpm:.4f}\n")

    print(f"Done: {len(results)} words written to {output_file}")


if __name__ == "__main__":
    main()

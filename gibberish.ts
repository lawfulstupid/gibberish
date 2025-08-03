type SequenceMap<A> = { [sequence: string]: A };
type CharCounter = { [char: string]: number };
type CharGen = ((rand: number) => string);
type NextCharGen = ((sequence: string, rand?: number) => string);
type GibberishGen = ((length: number) => string);

function analyse(sample: string, maxAccuracy: number = 2): NextCharGen {
  sample = preprocess(sample);

  // Count sequences
  const map: SequenceMap<CharCounter> = {};
  for (let accuracy = 1; accuracy <= maxAccuracy; accuracy++) {
    for (let i = 0; i < sample.length; i++) {
      const seq = sample.slice(i - accuracy, i);
      const next = sample[i];
      if (!map[seq]) map[seq] = {};
      if (!map[seq][next]) map[seq][next] = 0;
      map[seq][next]++;
    }
  }

  // Transform into functions
  const genMap: SequenceMap<CharGen> = {};
  for (let key in map) {
    const dict = map[key];
    const total = Object.values(dict).reduce((a, b) => a + b);
    genMap[key] = function (rand: number) {
      let n = rand * total;
      for (let char in dict) {
        if (n <= dict[char]) return char;
        n -= dict[char];
      }
      throw new Error('incomplete distribution');
    };
  }

  return function genNext(seq: string, rand: number = Math.random()) {
    if (!seq || seq.length === 0) {
      return genNext(' ', rand);
    } else if (seq in genMap) {
      return genMap[seq](rand);
    } else {
      return genNext(seq.slice(1), rand);
    }
  }
}

function preprocess(sample: string): string {
  return sample
    .normalize('NFKC') // maximises compatibility of accented characters
    .toLowerCase()
    // convert and compress whitespace to single space
    .replaceAll(/\s+/g, ' ')
    // substitute similar chars
    .replaceAll('—', '-')
    .replaceAll(/[‘’`′‚]/g, '\'')
    .replaceAll(/[“”«»„″]/g, '"')
    // subtitute compact chars
    .replaceAll('æ', 'ae')
    .replaceAll('œ', 'oe')
    .replaceAll('ß', 'ss')
    // legal characters
    // includes latin, greek, cyrillic alphabets w/ diacritics
    // and some punctuation
    .replaceAll(/[^0-9A-Za-zÀ-ÖØ-öø-žΆ-ώА-я& !?,.;:'\-]/g, '')
    .replaceAll(/('(?!\w))|((?<!\w)')/g, '') // only allow apostrophes as contractions
}

function postprocess(text: string): string {
  return text
    // convert and compress whitespace
    .replaceAll(/\s+/g, ' ')
    // convert to sentence case
    .replaceAll(/((^|[.!?])\s*[^\s])|(\bi\b)/gi, substr => substr.toUpperCase())
    // balance whitespace around dashes
    .replaceAll(/\s(-+)(?![\s-])/g, ' $1 ')
    .replaceAll(/(?<![\s-])(-+)\s/g, ' $1 ')
}

function createGenerator(sample: string, accuracy = 2): GibberishGen {
  const genNext = analyse(sample, accuracy);
  return function generate(length: number) {
    let text = '';
    while (text.length < length || text.slice(-1) !== '.') {
      text += genNext(text.slice(-accuracy));
    }
    return postprocess(text);
  }
}

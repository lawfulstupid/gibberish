type SequenceMap<A> = { [sequence: string]: A };
type CharCounter = { [char: string]: number };
type CharGen = ((rand: number) => string);
type NextCharGen = ((sequence: string, rand?: number) => string);
type GibberishGen = ((length: number) => string);

function analyse(sample: string, maxAccuracy: number = 2): NextCharGen {
  sample = preprocess(sample);

  // Count sequences
  const map: SequenceMap<CharCounter> = {};
  for (let accuracy = 0; accuracy <= maxAccuracy; accuracy++) {
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
    if (seq in genMap) {
      return genMap[seq](rand);
    } else {
      return genNext(seq.slice(1), rand);
    }
  }
}

function preprocess(sample: string): string {
  return sample.toLowerCase()
    // convert and compress whitespace to single space
    .replaceAll(/\s+/g, ' ')
    // substitute similar chars
    .replaceAll('—', '-')
    // .replaceAll(/[àáâãäå]/g, 'a')
    .replaceAll('æ', 'ae')
    // .replaceAll('ç', 'c')
    // .replaceAll(/[èéêë]/g, 'e')
    // .replaceAll(/[ìíîï]/g, 'i')
    // .replaceAll('ñ', 'n')
    // .replaceAll(/[òóôõö]/g, 'o')
    .replaceAll('œ', 'oe')
    // .replaceAll(/[ùúûü]/g, 'u')
    // .replaceAll(/[ýÿ]/g, 'y')
    // legal characters
    .replaceAll(/[^0-9a-zA-Z& !?,.;:—\-]/g, '')
}

function createGenerator(sample: string, accuracy = 2): GibberishGen {
  const genNext = analyse(sample, accuracy);
  return function generate(length: number) {
    let text = '';
    while (text.length < length || text.slice(-1) !== '.') {
      text += genNext(text.slice(-accuracy));
    }
    return text;
  }
}

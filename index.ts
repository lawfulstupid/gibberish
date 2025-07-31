import _ from 'lodash';
import * as fs from 'fs';

type SequenceMap = { [sequence: string]: CharCounter };
type CharCounter = { [char: string]: number };

export function analyse(sample: string, maxAccuracy: number = 2) {
  sample = preprocess(sample);

  // Count sequences
  const map: SequenceMap = {};
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
  const genMap = _.mapValues(map, dict => {
    const total = _(dict).values().sum();
    return function (rand: number) {
      let n = rand * total;
      for (let char in dict) {
        if (n <= dict[char]) return char;
        n -= dict[char];
      }
    };
  });

  return function genNext(seq: string, rand = Math.random()) {
    if (!seq || seq === '') {
      return genNext(' ', rand);
    } else if (seq in genMap) {
      return genMap[seq](rand);
    } else {
      return genNext(seq.slice(1), rand);
    }
  }
}

function preprocess(sample: string) {
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

export function createGenerator(sample: string, accuracy = 2) {
  const genNext = analyse(sample, accuracy);
  return function generate(length: number) {
    let text = '';
    while (text.length < length) {
      text += genNext(text.slice(-accuracy));
    }
    return text;
  }
}

export function load(file: string, accuracy: number) {
  let sample = fs.readFileSync(file).toString();
  return createGenerator(sample, accuracy);
}

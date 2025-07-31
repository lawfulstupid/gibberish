import _ from 'lodash';
import 'fs';

export function analyse(sample, maxAccuracy = 2) {
  sample = preprocess(sample);

  // Count sequences
  const map = {};
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
    return function (r) {
      let n = r * total;
      for (let char in dict) {
        if (n <= dict[char]) return char;
        n -= dict[char];
      }
    };
  });

  return function genNext(seq, r = Math.random()) {
    if (!seq || seq === '') {
      return genNext(' ', r);
    } else if (seq in genMap) {
      return genMap[seq](r);
    } else {
      return genNext(seq.slice(1), r);
    }
  }
}

function preprocess(sample) {
  return sample.toLowerCase()
    // convert and compress whitespace to single space
    .replaceAll(/\s+/g, ' ')
    // substitute similar chars
    .replaceAll()
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

export function createGenerator(sample, accuracy = 2) {
  const genNext = analyse(sample, accuracy);
  return function generate(length) {
    let text = '';
    while (text.length < length) {
      text += genNext(text.slice(-accuracy));
    }
    return text;
  }
}

export function load(file, accuracy) {
  let sample = fs.readFileSync(file).toString();
  return createGenerator(sample, accuracy);
}

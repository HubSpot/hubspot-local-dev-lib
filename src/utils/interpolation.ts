const delimiters = {
  interpolation: {
    start: '{{',
    end: '}}',
  },
};

function generateReplaceFn(
  matchedText: string,
  startIndex: number,
  replacementString: string | number
): (currentStringValue: string) => string {
  return function (currentStringValue: string): string {
    return `${currentStringValue.slice(0, startIndex)}${
      replacementString || ''
    }${currentStringValue.slice(startIndex + matchedText.length)}`;
  };
}

type InterpolationData = {
  [identifier: string]: string | number;
};

export function interpolate(
  stringValue: string,
  interpolationData: InterpolationData
): string {
  const interpolationIdentifierRegEx = new RegExp(
    `${delimiters.interpolation.start}(.*?)${delimiters.interpolation.end}`,
    'g'
  );
  const replaceQueue = [];
  let match: RegExpExecArray | null;

  // while & reduce necessary because RegExp.exec is stateful and only runs
  // from beginning to end of string
  while ((match = interpolationIdentifierRegEx.exec(stringValue)) != null) {
    const { 0: matchedText, 1: rawIdentifier, index } = match;
    const identifier = rawIdentifier.trim();

    if (identifier) {
      replaceQueue.unshift(
        generateReplaceFn(matchedText, index, interpolationData[identifier])
      );
    }
  }

  const compiledString = replaceQueue.reduce(
    (currentValue, replaceFn) => replaceFn(currentValue),
    stringValue
  );

  return compiledString;
}

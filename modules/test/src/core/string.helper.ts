type StringQuote = '"' | "'" | '`';

export const indexOf = (str: string, value: string, from = 0) => {
  const index = str.indexOf(value, from);
  if (index !== -1) {
    const quote = findQuote(str, from);
    if (quote && quote.index < index) {
      return indexOfQuote(str, value, index, quote.quote, quote.index + 1);
    }
  }
  return index;
};

export const lastIndexOf = (str: string, value: string, from = 0) => {
  const index = str.lastIndexOf(value, from);
  if (index !== -1) {
    const quote = findQuoteReverse(str, from);
    if (quote && quote.index < index) {
      return lastIndexOfQuote(str, value, index, quote.quote, quote.index + 1);
    }
  }
  return index;
};

export const findQuote = (str: string, from = 0) => {
  return findFirstQuote(str, "'", from) ?? findFirstQuote(str, '"', from) ?? findFirstQuote(str, '`', from);
};

export const findQuoteReverse = (str: string, from = str.length) => {
  return findLastQuote(str, "'", from) ?? findLastQuote(str, '"', from) ?? findLastQuote(str, '`', from);
};

const findFirstQuote = (str: string, quote: StringQuote, from: number) => {
  let index = str.indexOf(quote, from);
  while (index !== -1 && str[index - 1] === '\\') {
    index = str.indexOf(quote, index + 1);
  }
  return index === -1 ? undefined : { index, quote };
};

const findLastQuote = (str: string, quote: StringQuote, from: number) => {
  let index = str.lastIndexOf(quote, from);
  while (index !== -1 && str[index + 1] === '\\') {
    index = str.lastIndexOf(quote, index - 1);
  }
  return index === -1 ? undefined : { index, quote };
};

const indexOfQuote = (str: string, value: string, indexValue: number, quote: StringQuote, from: number): number => {
  const index = findFirstQuote(str, quote, from);
  if (index && index.index < indexValue) {
    return indexOf(str, value, index.index + 1);
  }
  return indexValue;
};

const lastIndexOfQuote = (str: string, value: string, indexValue: number, quote: StringQuote, from: number): number => {
  const index = findLastQuote(str, quote, from);
  if (index && index.index < indexValue) {
    return lastIndexOf(str, value, index.index + 1);
  }
  return indexValue;
};

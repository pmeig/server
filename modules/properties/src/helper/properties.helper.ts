const REGEX_INJECTOR_KEY = new RegExp('\\${(.*?)}', 'g');

export const mergeArray = (origin: any[], newValue: any[]) => {
  origin.push(...newValue);
  return origin;
};

export const mergeRecord = (origin: Record<string, any>, newValue: Record<string, any>) => {
  Object.entries(newValue).forEach(([key, value]) => {
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        origin[key] = mergeArray(origin[key] ?? [], value);
      } else origin[key] = mergeRecord(origin[key] ?? {}, value);
    } else {
      origin[key] = value;
    }
  });
  return origin;
};

export const extractKeys = (value: string) => {
  const matches = value.matchAll(REGEX_INJECTOR_KEY);
  let match = matches.next();
  const keys: string[] = [];
  while (!match.done) {
    keys.push(match.value[1]);
    match = matches.next();
  }
  return keys;
};

const BOOLEAN_REGEX = /^(true|false)$/;

export const isString = (value: any): value is string => {
  return typeof value === 'string' && (!isNumber(value) || !isBoolean(value));
};
export const isNumber = (value: any): value is number | string => {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  return Number(value.trim()) !== Number.NaN;
};

export const isBoolean = (value: any): value is boolean | string => {
  if (typeof value === 'boolean') return true;
  return typeof value === 'string' && BOOLEAN_REGEX.test(value.trim());
};

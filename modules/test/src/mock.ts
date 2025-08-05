type ObjectToMock<T> = object & { prototype?: T };
type Mock<T> = { [P in keyof T]: jest.Mock<any> } & T;

const excludes = [
  'constructor',
  'isPrototypeOf',
  'toLocaleString',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'propertyIsEnumerable'
];

const getAllProps = <T extends object>(target: ObjectToMock<T>) => {
  const props = new Set<string>();
  let obj = target;

  if (target.prototype) {
    obj = target.prototype;
    do {
      Object.getOwnPropertyNames(obj).forEach(key => props.add(key));
    } while ((obj = Object.getPrototypeOf(obj)));
    obj = target;
  }

  do {
    Object.getOwnPropertyNames(obj).forEach(key => props.add(key));
  } while ((obj = Object.getPrototypeOf(obj)));

  return props;
};

const applyMockToProps = <T extends object>(props: Set<string>, target: ObjectToMock<T>): Mock<T> => {
  return Array.from(props)
    .filter(key => !excludes.includes(key) && !key.startsWith('__'))
    .reduce((mockObject, key) => {
      try {
        if (typeof (target as any)[key] === 'function') {
          (mockObject as any)[key] = jest.fn();
        } else {
          (mockObject as any)[key] = jest.fn().mockImplementation(() => ({}));
        }
      } catch (error) {}

      return mockObject;
    }, {} as Mock<T>);
};

/**
 * Create a mock for all functions in a class or interface for jest
 * @param target If class = prototype, if interface without prototype
 * @returns mock object of jest
 */
export const mock = <T extends object>(target: ObjectToMock<T>): Mock<T> => {
  if (typeof target === 'undefined' || target === null) {
    return {} as Mock<T>;
  }
  const props = getAllProps<T>(target);

  return applyMockToProps<T>(props, target);
};

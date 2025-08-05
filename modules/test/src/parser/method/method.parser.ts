import { LineReader } from '../../line.reader';
import { BlockInfo, FieldInfo, MethodInfo } from '../../core/file-info';
import { Visibility } from '../../core/ts.type';

export type FieldType = Record<string>;

export class MethodParser implements LineReader {
  parameters: Record<string, FieldInfo> = {};
  body: {
    variables: Record<string, FieldInfo>;
    blocks: BlockInfo[];
  } = '';
  constructor(private readonly build: (parser: MethodParser) => LineReader) {}

  readLine(line: string): LineReader {
    if (line.startsWith('const ')) {
    }
    return undefined;
  }
}

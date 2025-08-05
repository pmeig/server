import { LineReader } from '../../line.reader';
import { FieldInfo, MethodInfo } from '../../core/file-info';
import { Visibility } from '../../core/ts.type';
import { indexOf } from '../../core/string.helper';
import { MethodParser } from './method.parser';

export const isArrowFunction = (line: string) => line.startsWith('const ') && indexOf(line, '=>') > -1;

export class ArrowParser implements LineReader, MethodInfo {
  private isImplementation = false;
  private method: MethodParser | undefined = undefined;

  name = '';
  parameters: Record<string, FieldInfo> = {};
  returnType = 'void';
  visibility: Visibility = 'public';

  constructor(private readonly build: (parser: ArrowParser) => LineReader) {}

  readLine(line: string): LineReader {
    let next: string | undefined = line;
    if (!this.method) {
      if (line.startsWith('const ')) {
        line = line.substring('const '.length).trimStart();
      }
      next = this.extractNameAndType(line);
    }
    return this.method?.readLine(next ?? '') ?? this;
  }

  private extractNameAndType(line: string): string | undefined {
    const equal = indexOf(line, '=');
    if (equal > -1) {
      this.name = line.substring(0, equal).trim();
      const separatorType = indexOf(this.name, ':');
      if (separatorType > -1) {
        this.returnType = this.name.substring(separatorType + 1).trimStart();
        this.name = this.name.substring(0, separatorType).trim();
      }
      this.method = new MethodParser(() => this.build(this));
      if (line.length <= equal) {
        return undefined;
      }
      return line.substring(equal + 1);
    } else {
      this.name = line;
    }
    return undefined;
  }
}

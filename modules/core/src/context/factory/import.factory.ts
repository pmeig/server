import { Type } from '../provider/provider.type';
import { Context, ModuleContext } from '../context.model';
import { retrieveConditionals } from '../../decorators/conditional/conditional.helper';
import { Nullable } from '../../helper/type.helper';
import { retrieveModuleContext } from '../context.decorators';
import { PromiseConditionalExecutor } from '../../decorators/conditional/conditional.decorators';

export class ImportFactory {
  ref = crypto.randomUUID();
  private readonly conditional: PromiseConditionalExecutor;
  private readonly context: Nullable<ModuleContext>;
  private instance?: Context;

  constructor(
    private readonly type: Type<any>,
    private readonly builder: (moduleContext: ModuleContext) => Promise<Context>
  ) {
    this.conditional = retrieveConditionals(type);
    this.context = retrieveModuleContext(type);
  }

  isAccessible(context: Context) {
    return this.conditional(this.type, context);
  }

  async build() {
    if (!this.instance && this.context) {
      this.instance = await this.builder(this.context);
    }
    return this.instance;
  }
}

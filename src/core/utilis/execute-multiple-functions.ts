/* eslint-disable @typescript-eslint/no-explicit-any */
export class ExecuteMultipleFunctions<T> {
  private funcs: Array<(...args: any[]) => Promise<T> | T> = []
  private args: any[][] = []

  // Método para adicionar funções e seus argumentos
  addFunction(func: (...args: any[]) => Promise<T> | T, ...args: any[]) {
    this.funcs.push(func)
    this.args.push(args)
  }

  // Método para executar todas as funções
  async execute() {
    const promises = this.funcs.map((func, index) => func(...this.args[index]))
    await Promise.all(promises)
    this.funcs = []
    this.args = []
  }
}

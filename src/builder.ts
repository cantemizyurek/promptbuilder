import type { PromptBuilder as PromptBuilderTypes } from "./types"

/**
 * Fluent builder class for constructing prompts with method chaining.
 * Provides an intuitive API with incremental configuration.
 *
 * @template InstructionT - The instruction template string type
 * @template TaskKeys - Union type of task key strings
 *
 * @example
 * const builder = promptBuilder()
 *   .instruction("Analyze the {{dataType}}")
 *   .example({ data: "sample" }, { result: "processed" })
 *   .taskKey("userId")
 *   .taskKey("data")
 *   .build()
 *
 * const result = builder({
 *   dataType: "user activity",
 *   userId: 456,
 *   data: "click events"
 * })
 */
export class PromptBuilder<
  InstructionT extends string = "",
  TaskKeys extends string = never
> {
  private _instruction: string = ""
  private _examples: PromptBuilderTypes.Example[] = []
  private _taskKeys: string[] = []

  /**
   * Sets the instruction template with optional {{placeholder}} variables.
   *
   * @param template - The instruction template string
   * @returns A new builder instance with the instruction set
   */
  instruction<T extends string>(template: T): PromptBuilder<T, TaskKeys> {
    const builder = new PromptBuilder<T, TaskKeys>()
    builder._instruction = template
    builder._examples = [...this._examples]
    builder._taskKeys = [...this._taskKeys]
    return builder
  }

  /**
   * Adds a few-shot learning example to the prompt.
   * Can be called multiple times to add multiple examples.
   *
   * @param input - The example input
   * @param output - The expected output for this input
   * @returns The same builder instance for chaining
   */
  example(
    input: unknown,
    output: unknown
  ): PromptBuilder<InstructionT, TaskKeys> {
    const builder = new PromptBuilder<InstructionT, TaskKeys>()
    builder._instruction = this._instruction
    builder._examples = [...this._examples, { input, output }]
    builder._taskKeys = [...this._taskKeys]
    return builder
  }

  /**
   * Adds a task key that will be extracted from the runtime values.
   * Can be called multiple times to add multiple keys.
   * No need for 'as const' annotations!
   *
   * @param key - The key name to extract from values
   * @returns A new builder instance with the key added
   */
  taskKey<K extends string>(key: K): PromptBuilder<InstructionT, TaskKeys | K> {
    const builder = new PromptBuilder<InstructionT, TaskKeys | K>()
    builder._instruction = this._instruction
    builder._examples = [...this._examples]
    builder._taskKeys = [...this._taskKeys, key]
    return builder
  }

  /**
   * Builds and returns the configured prompt function.
   * The returned function is fully typed based on instruction placeholders and task keys.
   *
   * @returns A function that accepts values and returns the formatted XML prompt
   */
  build(): (
    values:
      | PromptBuilderTypes.ExtractPlaceholders<InstructionT>
      | TaskKeys extends never
      ? Record<string, never>
      : Record<
          PromptBuilderTypes.ExtractPlaceholders<InstructionT> | TaskKeys,
          unknown
        >
  ) => string {
    return (values) => {
      const interpolatedPrompt = replaceTemplateVariables(
        this._instruction,
        values
      )

      let result = `<instructions>${interpolatedPrompt}</instructions>`

      if (this._examples.length > 0) {
        result += `\n\n<examples>${this._examples
          .map(
            (example, index) =>
              `\n<example index="${index}"><input>${objectToXml(
                example.input
              )}</input><output>${JSON.stringify(
                example.output
              )}</output></example>`
          )
          .join("")}\n</examples>`
      }

      if (this._taskKeys.length > 0) {
        const taskObject = this._taskKeys.reduce((acc, key) => {
          if (key in values) {
            acc[key] = values[key as keyof typeof values]
          }
          return acc
        }, {} as Record<string, unknown>)
        const taskXml = objectToXml(taskObject)
        result += `\n\n<task>${taskXml}</task>`
      }

      return result
    }
  }
}

/**
 * Creates a new prompt builder instance with a fluent API.
 * Use this factory function to start building prompts with method chaining.
 *
 * @returns A new PromptBuilder instance
 *
 * @example
 * const builder = promptBuilder()
 *   .instruction("Hello {{name}}")
 *   .taskKey("userId")
 *   .build()
 *
 * const result = builder({ name: "Alice", userId: 123 })
 */
export function promptBuilder(): PromptBuilder<"", never> {
  return new PromptBuilder()
}

/**
 * Escapes special XML characters to prevent malformed XML output.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for XML
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function objectToXml(
  obj: unknown,
  metadata?: Record<string, unknown>
): string {
  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    const strValue = String(obj)
    return typeof obj === "string" ? escapeXml(strValue) : strValue
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => objectToXml(item, { index })).join("")
  }

  if (obj === null || obj === undefined) {
    return ""
  }

  if (typeof obj === "object") {
    return Object.entries(obj)
      .map(([key, value]) => {
        const xmlValue = objectToXml(value)
        return `<${key}${
          metadata && "index" in metadata ? ` index="${metadata["index"]}"` : ""
        }>${xmlValue}</${key}>`
      })
      .join("")
  }

  return String(obj)
}

export function replaceTemplateVariables(
  template: string,
  values: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in values) {
      const value = values[key]
      return JSON.stringify(value)
    }
    return match
  })
}

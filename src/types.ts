export namespace PromptBuilder {
  /**
   * Example with input and output for prompt building.
   */
  export interface Example {
    input: unknown
    output: unknown
  }

  /**
   * Extracts placeholder keys from a template string.
   * E.g., "Hello {{name}}, you are {{age}}" => "name" | "age"
   */
  export type ExtractPlaceholders<S extends string> =
    S extends `${infer _Start}{{${infer Key}}}${infer Rest}`
      ? Key | ExtractPlaceholders<Rest>
      : never

  /**
   * Extracts keys from a readonly string array or returns never.
   */
  export type TaskKeys<T extends readonly string[] | undefined> =
    T extends readonly string[] ? T[number] : never

  /**
   * Combines placeholder keys and task keys.
   */
  export type RequiredKeys<
    PromptT extends string,
    TaskT extends readonly string[] | undefined
  > = ExtractPlaceholders<PromptT> | TaskKeys<TaskT>
}

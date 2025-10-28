# PromptBuilder

A TypeScript library for constructing structured XML prompts for LLMs with a fluent, chainable API.

## Features

- **Fluent API** - Intuitive method chaining for building prompts
- **Type-Safe** - Full TypeScript support with automatic type inference
- **Template Variables** - Easy placeholder interpolation with `{{variable}}` syntax
- **Few-Shot Learning** - Add examples to guide LLM behavior
- **Task Configuration** - Structure task-specific data in XML format
- **XML Escaping** - Automatic escaping of special characters for safe XML generation
- **No Dependencies** - Pure TypeScript implementation

## Installation

```bash
npm install promptbuilder
# or
pnpm add promptbuilder
# or
bun add promptbuilder
```

## Quick Start

```typescript
import { promptBuilder } from "promptbuilder"

// Create a simple prompt
const builder = promptBuilder()
  .instruction("Analyze the sentiment of the following text")
  .build()

const prompt = builder({})
console.log(prompt)
// Output: <instructions>Analyze the sentiment of the following text</instructions>
```

## API Reference

### `promptBuilder()`

Creates a new prompt builder instance. Returns a `PromptBuilder` object with chainable methods.

```typescript
const builder = promptBuilder()
```

### `.instruction(template: string)`

Sets the instruction template with optional `{{placeholder}}` variables for interpolation.

**Parameters:**

- `template` - The instruction string, can include `{{variableName}}` placeholders

**Returns:** A new builder instance for chaining

```typescript
const builder = promptBuilder()
  .instruction("Translate {{text}} to {{language}}")
  .build()

const prompt = builder({ text: "Hello", language: "Spanish" })
// Output: <instructions>Translate "Hello" to "Spanish"</instructions>
```

### `.example(input: unknown, output: unknown)`

Adds a few-shot learning example. Can be called multiple times to add multiple examples.

**Parameters:**

- `input` - The example input (any JSON-serializable value)
- `output` - The expected output for this input

**Returns:** The builder instance for chaining

```typescript
const builder = promptBuilder()
  .instruction("Answer math questions")
  .example({ question: "What is 2+2?" }, { answer: 4 })
  .example({ question: "What is 5*3?" }, { answer: 15 })
  .build()
```

### `.taskKey(key: string)`

Adds a task key that will be extracted from runtime values and included in the `<task>` section.
Can be called multiple times to add multiple keys.

**Parameters:**

- `key` - The key name to extract from values

**Returns:** A new builder instance for chaining

```typescript
const builder = promptBuilder()
  .instruction("Process user data")
  .taskKey("userId")
  .taskKey("action")
  .build()

const prompt = builder({ userId: 123, action: "login" })
// Output includes: <task><userId>123</userId><action>login</action></task>
```

### `.build()`

Finalizes the builder configuration and returns a typed function that accepts values and generates the XML prompt.

**Returns:** A function `(values: Record<string, unknown>) => string`

The returned function is fully type-safe - TypeScript will require all placeholder variables and task keys to be provided.

```typescript
const builder = promptBuilder()
  .instruction("Hello {name}")
  .taskKey("userId")
  .build()

// TypeScript enforces both 'name' and 'userId' are provided
const prompt = builder({ name: "Alice", userId: 123 })
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

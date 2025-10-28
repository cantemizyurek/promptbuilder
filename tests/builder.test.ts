import { describe, it, expect } from "vitest"
import {
  promptBuilder,
  objectToXml,
  replaceTemplateVariables,
  escapeXml,
} from "../src/builder"

describe("replaceTemplateVariables", () => {
  it("should replace a single placeholder with its value", () => {
    const result = replaceTemplateVariables("Hello {{name}}", { name: "World" })
    expect(result).toBe('Hello "World"')
  })

  it("should replace multiple placeholders", () => {
    const result = replaceTemplateVariables("Hello {{name}}, you are {{age}}", {
      name: "Alice",
      age: 30,
    })
    expect(result).toBe('Hello "Alice", you are 30')
  })

  it("should leave unmatched placeholders unchanged", () => {
    const result = replaceTemplateVariables("Hello {{name}}, you are {{age}}", {
      name: "Alice",
    })
    expect(result).toBe('Hello "Alice", you are {{age}}')
  })

  it("should handle object values with JSON.stringify", () => {
    const result = replaceTemplateVariables("User: {{user}}", {
      user: { name: "Bob", age: 25 },
    })
    expect(result).toBe('User: {"name":"Bob","age":25}')
  })

  it("should handle array values with JSON.stringify", () => {
    const result = replaceTemplateVariables("Items: {{items}}", {
      items: [1, 2, 3],
    })
    expect(result).toBe("Items: [1,2,3]")
  })

  it("should handle boolean values", () => {
    const result = replaceTemplateVariables("Active: {{active}}", {
      active: true,
    })
    expect(result).toBe("Active: true")
  })

  it("should handle number values", () => {
    const result = replaceTemplateVariables("Count: {{count}}", { count: 42 })
    expect(result).toBe("Count: 42")
  })

  it("should handle empty template", () => {
    const result = replaceTemplateVariables("", { name: "Test" })
    expect(result).toBe("")
  })

  it("should handle empty values object", () => {
    const result = replaceTemplateVariables("Hello {{name}}", {})
    expect(result).toBe("Hello {{name}}")
  })

  it("should handle template with no placeholders", () => {
    const result = replaceTemplateVariables("Hello World", { name: "Test" })
    expect(result).toBe("Hello World")
  })
})

describe("escapeXml", () => {
  it("should escape ampersands", () => {
    const result = escapeXml("Tom & Jerry")
    expect(result).toBe("Tom &amp; Jerry")
  })

  it("should escape less than signs", () => {
    const result = escapeXml("5 < 10")
    expect(result).toBe("5 &lt; 10")
  })

  it("should escape greater than signs", () => {
    const result = escapeXml("10 > 5")
    expect(result).toBe("10 &gt; 5")
  })

  it("should escape double quotes", () => {
    const result = escapeXml('He said "hello"')
    expect(result).toBe("He said &quot;hello&quot;")
  })

  it("should escape single quotes", () => {
    const result = escapeXml("It's working")
    expect(result).toBe("It&apos;s working")
  })

  it("should escape multiple special characters", () => {
    const result = escapeXml(`<tag attr="value">5 < 10 & 'test'</tag>`)
    expect(result).toBe(
      "&lt;tag attr=&quot;value&quot;&gt;5 &lt; 10 &amp; &apos;test&apos;&lt;/tag&gt;"
    )
  })

  it("should handle strings with no special characters", () => {
    const result = escapeXml("Hello World")
    expect(result).toBe("Hello World")
  })
})

describe("objectToXml", () => {
  describe("primitive types", () => {
    it("should convert string to string", () => {
      const result = objectToXml("hello")
      expect(result).toBe("hello")
    })

    it("should convert number to string", () => {
      const result = objectToXml(42)
      expect(result).toBe("42")
    })

    it("should convert boolean to string", () => {
      const result = objectToXml(true)
      expect(result).toBe("true")
    })

    it("should handle null as empty string", () => {
      const result = objectToXml(null)
      expect(result).toBe("")
    })

    it("should handle undefined as empty string", () => {
      const result = objectToXml(undefined)
      expect(result).toBe("")
    })
  })

  describe("arrays", () => {
    it("should convert array of primitives", () => {
      const result = objectToXml([1, 2, 3])
      expect(result).toBe("123")
    })

    it("should convert array with index metadata", () => {
      const result = objectToXml(["a", "b"], { index: 0 })
      expect(result).toBe("ab")
    })

    it("should handle empty array", () => {
      const result = objectToXml([])
      expect(result).toBe("")
    })
  })

  describe("objects", () => {
    it("should convert simple object to XML", () => {
      const result = objectToXml({ name: "Alice", age: 30 })
      expect(result).toBe("<name>Alice</name><age>30</age>")
    })

    it("should escape special characters in string values", () => {
      const result = objectToXml({ message: "Hello <world> & 'test'" })
      expect(result).toBe(
        "<message>Hello &lt;world&gt; &amp; &apos;test&apos;</message>"
      )
    })

    it("should convert nested object to XML", () => {
      const result = objectToXml({
        user: {
          name: "Bob",
          age: 25,
        },
      })
      expect(result).toBe("<user><name>Bob</name><age>25</age></user>")
    })

    it("should handle object with array values", () => {
      const result = objectToXml({ items: [1, 2, 3] })
      expect(result).toBe("<items>123</items>")
    })

    it("should handle empty object", () => {
      const result = objectToXml({})
      expect(result).toBe("")
    })

    it("should apply index metadata to object properties", () => {
      const result = objectToXml({ name: "Test" }, { index: 5 })
      expect(result).toBe('<name index="5">Test</name>')
    })
  })

  describe("complex nested structures", () => {
    it("should handle mixed nested structure", () => {
      const result = objectToXml({
        user: {
          name: "Charlie",
          tags: ["admin", "user"],
          active: true,
        },
      })
      expect(result).toBe(
        "<user><name>Charlie</name><tags>adminuser</tags><active>true</active></user>"
      )
    })

    it("should handle array of objects", () => {
      const result = objectToXml([
        { id: 1, name: "First" },
        { id: 2, name: "Second" },
      ])
      expect(result).toBe(
        '<id index="0">1</id><name index="0">First</name><id index="1">2</id><name index="1">Second</name>'
      )
    })
  })
})

describe("promptBuilder", () => {
  describe("basic functionality", () => {
    it("should create a simple prompt without variables", () => {
      const builder = promptBuilder().instruction("This is a test prompt").build()
      const result = builder({})
      expect(result).toBe("<instructions>This is a test prompt</instructions>")
    })

    it("should interpolate template variables", () => {
      const builder = promptBuilder()
        .instruction("Hello {{name}}, you are {{age}} years old")
        .build()
      const result = builder({ name: "Alice", age: 30 })
      expect(result).toBe(
        '<instructions>Hello "Alice", you are 30 years old</instructions>'
      )
    })
  })

  describe("with examples", () => {
    it("should include examples in the output", () => {
      const builder = promptBuilder()
        .instruction("Test prompt")
        .example({ question: "What is 2+2?" }, { answer: 4 })
        .build()
      const result = builder({})
      expect(result).toContain("<instructions>Test prompt</instructions>")
      expect(result).toContain("<examples>")
      expect(result).toContain('<example index="0">')
      expect(result).toContain(
        "<input><question>What is 2+2?</question></input>"
      )
      expect(result).toContain('<output>{"answer":4}</output>')
      expect(result).toContain("</example>")
      expect(result).toContain("</examples>")
    })

    it("should handle multiple examples", () => {
      const builder = promptBuilder()
        .instruction("Test prompt")
        .example({ question: "What is 2+2?" }, { answer: 4 })
        .example({ question: "What is 3+3?" }, { answer: 6 })
        .build()
      const result = builder({})
      expect(result).toContain('<example index="0">')
      expect(result).toContain('<example index="1">')
      expect(result).toContain("What is 2+2?")
      expect(result).toContain("What is 3+3?")
    })

    it("should handle no examples", () => {
      const builder = promptBuilder().instruction("Test prompt").build()
      const result = builder({})
      expect(result).not.toContain("<examples>")
      expect(result).toBe("<instructions>Test prompt</instructions>")
    })
  })

  describe("with task configuration", () => {
    it("should include task section with specified keys", () => {
      const builder = promptBuilder()
        .instruction("Process this data")
        .taskKey("userId")
        .taskKey("action")
        .build()
      const result = builder({ userId: 123, action: "login" })
      expect(result).toContain("<instructions>Process this data</instructions>")
      expect(result).toContain("<task>")
      expect(result).toContain("<userId>123</userId>")
      expect(result).toContain("<action>login</action>")
      expect(result).toContain("</task>")
    })

    it("should only include task keys that are present in values", () => {
      const builder = promptBuilder()
        .instruction("Process this data")
        .taskKey("userId")
        .taskKey("action")
        .taskKey("timestamp")
        .build()
      // @ts-expect-error - timestamp is not present in the values
      const result = builder({ userId: 123, action: "login" })
      expect(result).toContain("<userId>123</userId>")
      expect(result).toContain("<action>login</action>")
      expect(result).not.toContain("<timestamp>")
    })

    it("should handle task with complex values", () => {
      const builder = promptBuilder()
        .instruction("Process this data")
        .taskKey("user")
        .build()
      const result = builder({ user: { name: "Alice", role: "admin" } })
      expect(result).toContain("<user>")
      expect(result).toContain("<name>Alice</name>")
      expect(result).toContain("<role>admin</role>")
      expect(result).toContain("</user>")
    })
  })

  describe("complete integration", () => {
    it("should combine prompt, examples, and task", () => {
      const builder = promptBuilder()
        .instruction("Analyze the {{dataType}}")
        .example({ data: "sample" }, { result: "processed" })
        .taskKey("userId")
        .taskKey("data")
        .build()
      const result = builder({
        dataType: "user activity",
        userId: 456,
        data: "click events",
      })

      expect(result).toContain(
        '<instructions>Analyze the "user activity"</instructions>'
      )
      expect(result).toContain("<examples>")
      expect(result).toContain('<example index="0">')
      expect(result).toContain("<task>")
      expect(result).toContain("<userId>456</userId>")
      expect(result).toContain("<data>click events</data>")
    })

    it("should handle minimal configuration", () => {
      const builder = promptBuilder().instruction("Simple prompt").build()
      const result = builder({})
      expect(result).toBe("<instructions>Simple prompt</instructions>")
    })

    it("should support flexible method chaining order", () => {
      const builder = promptBuilder()
        .taskKey("userId")
        .example({ input: "test" }, { output: "result" })
        .instruction("Process {{action}}")
        .taskKey("data")
        .example({ input: "test2" }, { output: "result2" })
        .build()
      const result = builder({ action: "validation", userId: 123, data: "info" })

      expect(result).toContain('<instructions>Process "validation"</instructions>')
      expect(result).toContain('<example index="0">')
      expect(result).toContain('<example index="1">')
      expect(result).toContain("<userId>123</userId>")
      expect(result).toContain("<data>info</data>")
    })
  })
})

import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const MODEL = "claude-sonnet-4-6"

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2000
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const block = response.content[0]
  return block.type === "text" ? block.text : ""
}

export async function* streamAgent(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2000
): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield chunk.delta.text
    }
  }
}

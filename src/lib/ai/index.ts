import OpenAI from "openai";

export type AIProvider = "openai" | "anthropic" | "local";

interface AIConfig {
  provider: AIProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

const defaultConfig: AIConfig = {
  provider: "openai",
  model: "gpt-4o-mini",
};

function getClient(config: AIConfig = defaultConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    baseURL: config.baseURL,
  });
}

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  config?: AIConfig
): Promise<string> {
  const client = getClient(config);
  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await client.chat.completions.create({
    model: config?.model || defaultConfig.model!,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return response.choices[0]?.message?.content || "";
}

export async function summarize(text: string, config?: AIConfig): Promise<string> {
  return generateText(
    text,
    "You are a helpful assistant that creates concise summaries. Summarize the following text in a clear and brief manner.",
    config
  );
}

export async function classify(
  text: string,
  categories: string[],
  config?: AIConfig
): Promise<string> {
  return generateText(
    `Text to classify: "${text}"\n\nCategories: ${categories.join(", ")}\n\nRespond with ONLY the category name that best matches.`,
    "You are a text classification assistant. Classify the given text into one of the provided categories. Respond with only the category name.",
    config
  );
}

export async function generateReply(
  emailContent: string,
  instructions: string,
  config?: AIConfig
): Promise<string> {
  return generateText(
    `Email content:\n${emailContent}\n\nInstructions for reply:\n${instructions}`,
    "You are an email assistant. Generate a professional reply to the given email following the provided instructions.",
    config
  );
}

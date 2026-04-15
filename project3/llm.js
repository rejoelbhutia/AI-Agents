export const SYSTEM_PROMPT = `You are a precise AI assistant.

Answer the user using only the provided context from the knowledge base.

If the answer is not in the context, say: "I don't know based on the provided information."

If the context is large, summarize it before answering.

Keep answers short, clear, and factual.
    `;

export const connectLLM = async (input) => {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.1",
        messages: input,
        stream: false,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Error: ", error.message);
    return null;
  }
};

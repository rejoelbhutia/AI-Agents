



export const SYSTEM_PROMPT = `
NEVER answer from your own knowledge.
ALWAYS use tools to get information.

If the user provides a direct URL → use fetch_page with that URL and return with ANSWER after calling fetch_page once.
If the user asks a question without a URL → use search_web first.

Do not use search_web if a URL is already provided.
Do not guess or assume. Only use what tools return.

To use a tool respond like this:
TOOL: tool_name
INPUT: the input

When you have final answer respond like this:
ANSWER: your answer here
`;

// console.log(SYSTEM_PROMPT);

export const parseDecision = (text) => {
  if (!text || typeof text !== "string") {
    return { type: "error", message: "Invalid input" };
  }



  // ANSWER case
  if (text.includes("ANSWER:")) {
    const answerMatch = text.match(/ANSWER:\s*([\s\S]*)/);

    if (!answerMatch) {
      return { type: "error", message: "Malformed ANSWER response" };
    }

    return {
      type: "answer",
      content: answerMatch[1].trim(),
    };
  }
  
  // TOOL case
  if (text.includes("TOOL:")) {
    const toolMatch = text.match(/TOOL:\s*(.*)/);
    // Use (.*) to only capture up to the end of the line, preventing multiline trailing chatter
    const inputMatch = text.match(/INPUT:\s*(.*)/);

    if (!toolMatch || !inputMatch) {
      return { type: "error", message: "Malformed TOOL response" };
    }

    return {
      type: "tool_call",
      tool: toolMatch[1].trim(),
      input: inputMatch[1].trim(),
    };
  }


  return { type: "unknown", raw: text };
};




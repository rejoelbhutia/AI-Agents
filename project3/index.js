import PromptSync from "prompt-sync";
import { pdfParser } from "./pdf-parser.js";
import embedder from "./embedder.js";
import { collection } from "./db.js";
import { connectLLM } from "./llm.js";
import { SYSTEM_PROMPT } from "./llm.js";
import fs from "fs";

const input = PromptSync();
const pdfPath = input("Enter the path of the pdf: ");

if (!pdfPath || !fs.existsSync(pdfPath)) {
  console.log(
    `\n Error: The file at path '${pdfPath}' does not exist or is inaccessible.`,
  );
  console.log(
    "If you are running in Docker, ensure the file is in the project folder or its directory is mounted as a volume!\n",
  );
  process.exit(1);
}

const rawText = await pdfParser(pdfPath);

if (!rawText) {
  console.log("\nError: Could not extract any text from the PDF.");
  process.exit(1);
}

function createChunks(rawText, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let currentIndex = 0;

  while (currentIndex < rawText.length) {
    let chunk = rawText.slice(currentIndex, currentIndex + chunkSize);
    chunks.push(chunk);

    // Move the index forward, subtracting the overlap
    // so the next chunk starts a little bit before this one ended
    currentIndex += chunkSize - overlap;
  }

  return chunks;
}

if (rawText) {
  console.log(`Success! Extracted ${rawText.length} characters.`);
  console.log("Raw text: ", rawText);

  const chunks = createChunks(rawText);

  console.log(`Created ${chunks.length} chunks. Generating embeddings...`);
  const embeddings = await Promise.all(chunks.map((chunk) => embedder(chunk))); //Promise.all is a JavaScript method used to run multiple asynchronous tasks in parallel and wait until all of them finish.

  // Remove any chunks where embeddings failed (e.g. came back null)
  const validChunks = [];
  const validEmbeddings = [];

  for (let i = 0; i < embeddings.length; i++) {
    if (embeddings[i] !== null) {
      validChunks.push(chunks[i]);
      validEmbeddings.push(embeddings[i]);
    }
  }

  const ids = validChunks.map((_, i) => `chunk_${i}`); //_ means not using it or ignoring it.

  if (validEmbeddings.length > 0) {
    console.log("Inserting into ChromaDB collection...");
    await collection.add({
      ids: ids,
      embeddings: validEmbeddings,
      documents: validChunks,
    });
  } else {
    console.log("No valid embeddings were generated. Skipping insertion.");
  }
}
let history = [
  { role: "system", content: SYSTEM_PROMPT }
];

while (true) {
  const query = input("\nAsk a question (or type 'exit'): ");
  if (query.toLowerCase() === "exit") {
    break;
  }
  
  // 1. Get embeddings for the user's question
  const embedding = await embedder(query);
  
  // 2. Query the vector database for relevant chunks
  const result = await collection.query({
    queryEmbeddings: [embedding],
    nResults: 3,
  });
  
  // 3. Format the retrieved context into a single string
  const contextChunks = result.documents[0].join("\n\n");
  
  // 4. Combine the retrieved context and the user's actual question!
  const userMessage = `Context Information:\n${contextChunks}\n\nUser Question: ${query}`;
  
  // 5. Add user message to history
  history.push({ role: "user", content: userMessage });
  
  // 6. Send the history to the LLM
  const llmResponse = await connectLLM(history);
  
  // 7. Add the LLM's response to history so it remembers the conversation
  history.push({ role: "model", content: llmResponse.message.content });
  
  console.log(`\nAgent: ${llmResponse.message.content}\n`);
}
///home/rejoel/Downloads/Rejoel_Resume(updated).pdf

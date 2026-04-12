  const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "mistral",
    prompt: "What is AI Agent?",
    stream: false
  })
});
const data = await response.json();

console.log(data);

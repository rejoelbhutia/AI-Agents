import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { SYSTEM_PROMPT, parseDecision } from "./agent.js";
import { tools } from "./tools.js";
import promptSync from "prompt-sync";
const prompt = promptSync({ sigint: true });
dotenv.config();

let spinnerInterval;
const startSpinner = (msg = "Thinking") => {
    const P = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let x = 0;
    spinnerInterval = setInterval(() => {
        process.stdout.write(`\r\x1b[36m${P[x++]} ${msg}...\x1b[0m`);
        x %= P.length;
    }, 100);
};

const stopSpinner = () => {
    if (spinnerInterval) clearInterval(spinnerInterval);
    process.stdout.write('\r\x1b[K'); // clear the line
};

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_KEY
})

export const connectLLM = async (history) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: history,
            config: {
                systemInstruction: SYSTEM_PROMPT,
            },
        })
        return response.text;
    } catch (error) {
        return `Error occured ${error.message}`
    }
}

const connectMistral = async(history) => {
    const ollamaMistral = [{role: "system", content: SYSTEM_PROMPT}, ...history]
    try {
        const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3.1",
    messages: ollamaMistral,
    stream: false
  })
});
const data = await response.json();

return data.message.content;
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}
let history = [];
const main = async () => {

     console.log("Welcome to AI Agent which will search the webpages and give you summary about your topic. Type 'exit' to exit the agent");
    while (true) {
        let input = prompt("You: ");
        if (input === "exit") {
            console.log("Thank You for using AI Agent");
            break;
        }

        // history.push({role: "user", parts: [{text: input}]})
        history.push({role: "user", content: input})
        
        let running = true;
        let loopCount = 0;
        const MAX_LOOPS = 5;

        while (running) {
            if (loopCount >= MAX_LOOPS) {
                console.log("\nAgent: [System] I've reached my maximum thought limit (5 loops). Stopping to prevent infinite loops.");
                running = false;
                break;
            }
            loopCount++;

            startSpinner("Agent is thinking");
            let response = await connectMistral(history);
            console.log("Response:  ", response);
            
            stopSpinner();
            // history.push({role: "model", parts: [{text: response}]})
            history.push({role: "model", content: response})
            let agentDecision = parseDecision(response);
            
            if (agentDecision.type === "answer") {
                console.log(`Agent: ${agentDecision.content}`);
                running = false;
            } else if (agentDecision.type === "tool_call") {
               let toolName =  agentDecision.tool;
               if (tools[toolName]) {
                   startSpinner(`Executing tool: ${toolName}`);
                   let toolResult = await tools[toolName](agentDecision.input);
                   stopSpinner();
                //    history.push({role: "user", parts: [{text: toolResult}]});
                history.push({role: "user", content: toolResult})
               } else {
                //    history.push({role: "user", parts: [{text: `System Error: Tool '${toolName}' not found.`}]});
                history.push({role: "user", content: `System Error: Tool '${toolName}' not found.`})
               }
            } else {
            //    history.push({role: "user", parts: [{text: "System Error: Format not recognized. Please exclusively use TOOL:/INPUT: or ANSWER:"}]});
            history.push({role: "user", content: "System Error: Format not recognized. Please exclusively use TOOL:/INPUT: or ANSWER:"})
            }

        }  
        
        // Keep only the last few messages to prevent the context window from growing too large.
        // We do this after the thought loop completes.
        const MAX_HISTORY = 10;
        if (history.length > MAX_HISTORY) {
            history = history.slice(history.length - MAX_HISTORY);
        }
        
        // console.log(history);
          

    }
}

main();
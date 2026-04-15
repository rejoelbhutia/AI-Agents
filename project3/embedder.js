const embedder = async (rawText) => {
    try {
        const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
        const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                model:  "mxbai-embed-large",
                prompt: rawText
            })
        })

        const data = await response.json();
        return data.embedding;
        
    } catch (error) {
        console.log("Error: ", error.message);
        return null;
    }
}//returns array
export default embedder;
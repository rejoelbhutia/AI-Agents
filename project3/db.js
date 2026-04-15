import { ChromaClient } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL;
const client = new ChromaClient({
    path: CHROMA_URL
});

export const collection = await client.getOrCreateCollection({
    name: 'my_collection'
})


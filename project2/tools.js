import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_KEY;

export const tools = {
  search_web: async (query) => {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: API_KEY,
          query: query,
          search_depth: "basic",
          max_result: 3,
        }),
      });
      const data = await response.json();
      // console.log("Response from tavily: ", data);

      if (
        !data.results ||
        !Array.isArray(data.results) ||
        data.results.length === 0
      ) {
        return "No relevant result found";
      }

      const formattedResults = data.results
        .map(
          (res) =>
            `Title: ${res.title}\nContent: ${res.content}\nURL: ${res.url}`,
        )
        .join("\n\n---\n\n");
      // console.log("Tavily Results: ", formattedResults);
      return formattedResults;
    } catch (error) {
      return `Error searching the web ${error.message}`;
    }
  },

  fetch_page: async (url) => {
    try {
      const response = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: API_KEY,
          urls: [url],
        }),
      });
      const data = await response.json();
      console.log("Tavily data:", JSON.stringify(data, null, 2));

      if (
        !data.results ||
        data.results.length === 0 ||
        !data.results[0].raw_content
      ) {
        return "Error: Could not extract content from the page.";
      }

      const pageContent = data.results[0].raw_content;

      // Pro-tip: If the page is too long, the local LLM might crash or timeout.
      // Let's limit it to the first 500 characters for local models to handle easily.
      const cleaned = pageContent
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      return cleaned.substring(0, 4000) + "... [Truncated]";
    } catch (error) {
      return `Error reading page: ${error.message}`;
    }
  },
};

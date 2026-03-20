const { Configuration, OpenAIApi } = require("openai");
const { getJson } = require("serpapi");
const { traceable } = require("langsmith");
require("dotenv").config();

const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
);

const SERPAPI_KEY = process.env.SERP_API_KEY;

// Helper to shorten long snippets
function truncateText(text, maxLength = 200) {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Step 1: Refine the user's entertainment search into a better Google query
const generateRefinedSearchQuery = traceable(async (searchTerm, location, category) => {
    const response = await openai.createCompletion({
        model: "gpt-3.5-turbo-instruct",
        prompt: `
Refine this search into a short Google query for finding local entertainment events in the Dallas-Fort Worth metroplex.

Search term: ${searchTerm || "events"}
Location: ${location || "Dallas-Fort Worth"}
Category: ${category || "entertainment"}

Return only the search query.
        `,
        presence_penalty: 0,
        frequency_penalty: 0.2,
        max_tokens: 40,
        temperature: 0
    });

    return response.data.choices[0].text.trim();
});

// Step 2: Turn raw search results into event-style output
const formatSearchResults = traceable(async (topResults, location, category) => {
    const response = await openai.createCompletion({
        model: "gpt-3.5-turbo-instruct",
        prompt: `
You are helping build a Dallas entertainment website.

Using the search results below, create a short list of 3 event suggestions.
Each event should include:
- Event name
- Likely location/city
- Category
- Short one-sentence description

If exact details are missing, infer cautiously from the result title/snippet.

Search results:
${JSON.stringify(topResults, null, 2)}

Location filter: ${location || "Dallas-Fort Worth"}
Category filter: ${category || "Entertainment"}

Format your response exactly like this:

- Event Name | City | Category | Description
- Event Name | City | Category | Description
- Event Name | City | Category | Description
        `,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 250,
        temperature: 0.3
    });

    return response.data.choices[0].text.trim();
});

const handler = async (event) => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Request body is missing" })
            };
        }

        const requestBody = JSON.parse(event.body);
        const { searchTerm, location, category } = requestBody;

        if (!searchTerm && !location && !category) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "At least one search field is required" })
            };
        }

        console.log("Processing entertainment search for:", {
            searchTerm,
            location,
            category
        });

        // Step 1: Refine query
        const refinedQuery = await generateRefinedSearchQuery(searchTerm, location, category);

        console.log("Refined Search Query:", refinedQuery);

        // Step 2: Search Google for events
        const searchResults = await getJson({
            engine: "google",
            api_key: SERPAPI_KEY,
            q: refinedQuery + " Dallas OR Fort Worth events",
            num: 5
        });

        const organicResults = searchResults["organic_results"] || [];

        const topResults = organicResults.slice(0, 5).map(item => ({
            title: item.title,
            snippet: truncateText(item.snippet || "", 200),
            source: item.source || item.displayed_link || "",
            link: item.link || ""
        }));

        console.log("Top Results:", topResults);

        // Step 3: Format results
        const formattedResponse = await formatSearchResults(topResults, location, category);

        console.log("Formatted Response:", formattedResponse);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                results: formattedResponse
            })
        };
    } catch (error) {
        console.error("Entertainment Search Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.toString() })
        };
    }
};

module.exports = { handler };

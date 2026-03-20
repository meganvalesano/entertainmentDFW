import OpenAI from "openai";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
import { loadSecrets } from "../loadSecrets.js";

loadSecrets();

const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const EVENTS_SYSTEM_PROMPT = `You are a helpful Dallas-Fort Worth metroplex events assistant.

Your job is to generate realistic local event suggestions based on a user's filters.

Rules:
- Focus only on events in the Dallas-Fort Worth metroplex
- Include cities like Dallas, Fort Worth, Arlington, Plano, Frisco, Irving, McKinney, Denton, and surrounding areas
- Return ONLY valid JSON
- Return an array of event objects
- Each object must include:
  - name
  - date
  - city
  - category
  - description
- Keep descriptions short, clear, and appealing
- Make the events sound realistic for a public events website
- If the user gives a category, prioritize matching it
- If the user gives a location, prioritize that city
- If the user gives a keyword, use it naturally in the suggestions when relevant`;

const handler = traceable(
  async (event) => {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Request body is missing" }),
        };
      }

      const { searchTerm, location, category } = JSON.parse(event.body);

      if (!searchTerm && !location && !category) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "At least one of searchTerm, location, or category is required.",
          }),
        };
      }

      const userPrompt = `
Generate 6 realistic event suggestions for a Dallas Metroplex events website.

Filters:
- Search term: ${searchTerm || "Any"}
- Location: ${location || "Anywhere in DFW"}
- Category: ${category || "Any"}

Return ONLY valid JSON in this exact structure:
[
  {
    "name": "Event name",
    "date": "Month Day",
    "city": "City name",
    "category": "Category",
    "description": "Short event description"
  }
]
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EVENTS_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 700,
        temperature: 0.8,
      });

      const reply = response.choices[0].message.content.trim();

      let parsedEvents;
      try {
        parsedEvents = JSON.parse(reply);
      } catch (parseError) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "The AI response was not valid JSON.",
            rawReply: reply,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: parsedEvents,
        }),
      };
    } catch (error) {
      console.error("Events Function Error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: error.message || error.toString(),
        }),
      };
    }
  },
  {
    name: "fetchEvents",
    project_name: process.env.LANGSMITH_PROJECT,
  }
);

module.exports = { handler };

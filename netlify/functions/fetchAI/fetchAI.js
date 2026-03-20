import OpenAI from "openai";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
import { loadSecrets } from "../loadSecrets.js";

loadSecrets();

const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
);

const handler = traceable(async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const { searchTerm, location, category } = requestBody;

    if (!searchTerm && !location && !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "At least one search field is required." })
      };
    }

    const prompt = `
You are an events assistant for the Dallas-Fort Worth metroplex.

A user is searching for local events.
Search term: ${searchTerm || "Any"}
Location: ${location || "Anywhere in the Dallas Metroplex"}
Category: ${category || "Any"}

Generate 5 event suggestions that match the user's interests.
For each event, return:
- name
- date
- city
- category
- short description

Respond only in valid JSON using this format:
[
  {
    "name": "Event name",
    "date": "Month Day",
    "city": "City name",
    "category": "Category",
    "description": "Short description"
  }
]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful local events assistant that creates realistic Dallas Metroplex event suggestions in clean JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.toString()
      })
    };
  }
}, {
  name: "generateEvents",
  project_name: process.env.LANGSMITH_PROJECT
});

module.exports = { handler };

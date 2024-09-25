import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const createOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
};

router.post('/generate-content-ideas', async (req, res) => {
  try {
    const { keyword, niche, platform, tone, targetAudience } = req.body;

    // Check if all required fields are provided
    if (!keyword || !niche || !platform || !tone || !targetAudience) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const openai = createOpenAIClient();

    // Create the prompt for the OpenAI API
    const prompt = `You are an expert content strategist specializing in brainstorming engaging content ideas for various platforms and audiences.

Please generate 3 compelling content ideas based on the following inputs:

Keyword: ${keyword}
Niche: ${niche}
Platform: ${platform}
Tone: ${tone}
Target Audience: ${targetAudience}

Instructions:

Generate Content Ideas:
Provide 3 unique and engaging content ideas related to the given topic.
Ensure each idea is specific, informative, and has the potential to attract traffic.
Tailor each idea to the specified platform and content type, considering factors like:
  * **Platform-specific formats:** E.g., articles for blogs, videos for YouTube, podcasts for audio platforms.
  * **Character limits or word counts:** Adhere to platform-specific guidelines.
  * **Visual elements:** Consider the use of images, graphics, or videos to enhance engagement.

For each idea, specify:

1. Title: A brief, SEO-optimized title (e.g., including relevant keywords).
2. Description: A brief explanation for each title, similar to the following format:
   - "Building Your Brand: Strategies for New Businesses"
   - Insights on establishing a strong brand identity and marketing strategy for newly launched businesses.
   - "Legal Considerations When Starting Your Business"
   - An overview of the legal aspects entrepreneurs need to consider, including registration, permits, and compliance.

Respond strictly with a JSON object containing a list called "content_ideas" where each item adheres to this structure:

JSON
{
  "title": "SEO-Friendly Title (e.g., Keyword-Rich Title)",
  "description": "A brief explanation of the idea."
}
`;

    // Call OpenAI API to generate content ideas
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });

    const content = chatCompletion.choices[0].message.content;

    // Extract JSON from the OpenAI response
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON found in OpenAI response.");
    }

    const validJson = content.slice(jsonStart, jsonEnd);

    try {
      const contentIdeas = JSON.parse(validJson).content_ideas;
      res.json({ content_ideas: contentIdeas });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, validJson);
      res.status(500).json({ error: 'Failed to parse content ideas from OpenAI. Please clear your cache and try again.' });
    }

  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: 'An error occurred while generating ideas. Please clear your cache and try again.' });
  }
});

export default router;

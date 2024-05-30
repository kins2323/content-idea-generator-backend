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

    if (!keyword || !niche || !platform || !tone || !targetAudience) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const openai = createOpenAIClient();

    const prompt = `You are an expert content strategist specializing in brainstorming engaging content ideas for various platforms and audiences.
    Please generate 3 compelling content ideas based on the following inputs:

    * **Keyword:** ${keyword}
    * **Topic:** ${niche}
    * **Platform:** ${platform}
    * **Tone:** ${tone}
    * **Target Audience:** ${targetAudience}

    **Instructions:**

    1. **Generate Content Ideas:**
      - Provide 3 unique and engaging content ideas related to the given topic.
      - Ensure each idea is specific, informative, and has the potential to attract traffic.

    2. **Detail Each Idea:**
      - For each content idea, include a brief SEO-friendly title.
      - Provide a brief description containing exactly 3 bullet points on what the content should talk about.

    Respond strictly with a JSON object containing a list called "content_ideas".

    ---`;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });

    const content = chatCompletion.choices[0].message.content;

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

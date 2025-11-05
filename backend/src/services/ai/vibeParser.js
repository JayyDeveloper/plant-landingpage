const OpenAI = require('openai');
const logger = require('../../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class VibeParser {
  /**
   * Parse user input to extract vibe preferences
   * @param {string} userInput - Natural language input from user
   * @param {object} context - Optional context from previous interactions
   * @returns {object} Parsed vibe profile
   */
  async parseVibe(userInput, context = {}) {
    try {
      const systemPrompt = `You are a vibe analysis expert for a newsletter platform.
Your job is to analyze user descriptions and extract structured vibe preferences.

Extract the following from user input:
1. mood: array of mood descriptors (e.g., ["fun", "energetic", "warm"])
2. tone: array of tone descriptors (e.g., ["casual", "friendly", "playful"])
3. style: overall aesthetic style (e.g., "modern", "vintage", "minimalist")
4. audience: target audience description
5. topic: newsletter subject matter
6. keywords: important keywords that define the vibe

Return ONLY valid JSON in this exact format:
{
  "mood": ["mood1", "mood2"],
  "tone": ["tone1", "tone2"],
  "style": "style description",
  "audience": "audience description",
  "topic": "topic description",
  "keywords": ["keyword1", "keyword2"],
  "confidence": 0.0-1.0
}`;

      const userPrompt = `Analyze this user input and extract vibe preferences:
"${userInput}"

${context.previousVibes ? `Previous vibes: ${JSON.stringify(context.previousVibes)}` : ''}
${context.savedPreferences ? `Saved preferences: ${JSON.stringify(context.savedPreferences)}` : ''}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const vibeProfile = JSON.parse(response.choices[0].message.content);

      logger.info('Vibe parsed successfully', { vibeProfile });
      return vibeProfile;

    } catch (error) {
      logger.error('Error parsing vibe:', error);
      throw new Error('Failed to parse vibe preferences');
    }
  }

  /**
   * Map vibe to design tokens (colors, fonts, layouts)
   * @param {object} vibeProfile - Parsed vibe profile
   * @returns {object} Design tokens
   */
  async mapVibeToDesign(vibeProfile) {
    try {
      const systemPrompt = `You are a design system expert. Map vibe descriptions to specific design tokens.

Return ONLY valid JSON in this exact format:
{
  "colors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "text": "#HEX"
  },
  "typography": {
    "headingFont": "font name",
    "bodyFont": "font name",
    "headingSize": "size with unit",
    "bodySize": "size with unit",
    "lineHeight": 1.0-2.0
  },
  "layout": {
    "structure": "single-column|two-column|card-based|magazine",
    "maxWidth": "width with unit",
    "padding": "padding with unit",
    "blockSpacing": "spacing with unit"
  },
  "imagery": {
    "style": "description",
    "filters": "description",
    "preferredSubjects": ["subject1", "subject2"]
  }
}`;

      const userPrompt = `Map this vibe to design tokens:
${JSON.stringify(vibeProfile, null, 2)}

Consider:
- Mood influences color palette and imagery
- Tone influences typography and spacing
- Style influences overall layout structure
- Audience influences complexity and accessibility`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const designTokens = JSON.parse(response.choices[0].message.content);

      logger.info('Design tokens generated', { designTokens });
      return designTokens;

    } catch (error) {
      logger.error('Error mapping vibe to design:', error);
      throw new Error('Failed to generate design tokens');
    }
  }

  /**
   * Generate content strategy based on vibe
   * @param {object} vibeProfile - Parsed vibe profile
   * @returns {object} Content strategy
   */
  async generateContentStrategy(vibeProfile) {
    try {
      const systemPrompt = `You are a content strategist for newsletters. Create a content structure plan based on vibe.

Return ONLY valid JSON in this exact format:
{
  "structure": [
    {
      "type": "hero|mainContent|feature|cta|quote",
      "content": "description of what goes here",
      "length": "50-100 words",
      "tone": "description"
    }
  ],
  "languagePatterns": {
    "sentenceStarters": ["starter1", "starter2"],
    "avoid": ["thing to avoid"],
    "include": ["thing to include"]
  },
  "suggestedSections": ["section name 1", "section name 2"]
}`;

      const userPrompt = `Create content strategy for this vibe:
${JSON.stringify(vibeProfile, null, 2)}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' }
      });

      const contentStrategy = JSON.parse(response.choices[0].message.content);

      logger.info('Content strategy generated', { contentStrategy });
      return contentStrategy;

    } catch (error) {
      logger.error('Error generating content strategy:', error);
      throw new Error('Failed to generate content strategy');
    }
  }

  /**
   * Complete vibe processing pipeline
   * @param {string} userInput - User's natural language input
   * @param {object} context - Optional context
   * @returns {object} Complete vibe configuration
   */
  async processVibe(userInput, context = {}) {
    try {
      // Step 1: Parse vibe from user input
      const vibeProfile = await this.parseVibe(userInput, context);

      // Step 2: Map to design tokens
      const designTokens = await this.mapVibeToDesign(vibeProfile);

      // Step 3: Generate content strategy
      const contentStrategy = await this.generateContentStrategy(vibeProfile);

      return {
        vibeProfile,
        designTokens,
        contentStrategy,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in vibe processing pipeline:', error);
      throw error;
    }
  }
}

module.exports = new VibeParser();

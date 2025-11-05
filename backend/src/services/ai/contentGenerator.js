const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../../config/logger');
const { getRedisClient } = require('../../config/database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

class ContentGenerator {
  /**
   * Generate newsletter headline
   * @param {object} options - Generation options
   * @returns {array} Array of headline options
   */
  async generateHeadline(options) {
    const {
      topic,
      vibe,
      tone = [],
      targetLength = 60,
      count = 3
    } = options;

    try {
      const systemPrompt = `You are an expert newsletter headline writer. Create compelling,
engaging headlines that match the specified vibe and tone.

Guidelines:
- Length: ${targetLength}-${targetLength + 20} characters
- Include emotional hooks
- Create curiosity without clickbait
- Match the tone: ${tone.join(', ')}
- Topic: ${topic}

Return ONLY valid JSON:
{
  "headlines": [
    {
      "text": "headline text",
      "score": 0.0-1.0,
      "reasoning": "why this works"
    }
  ]
}`;

      const userPrompt = `Generate ${count} headline options for a newsletter about: ${topic}

Vibe: ${JSON.stringify(vibe)}
Tone: ${tone.join(', ')}

Make them feel ${vibe.mood?.join(', ') || 'engaging'}.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      logger.info(`Generated ${result.headlines.length} headlines`);

      return result.headlines;

    } catch (error) {
      logger.error('Error generating headlines:', error);
      throw new Error('Failed to generate headlines');
    }
  }

  /**
   * Generate newsletter content section
   * @param {object} options - Generation options
   * @returns {string} Generated content
   */
  async generateContent(options) {
    const {
      sectionType,
      topic,
      vibe,
      tone = [],
      targetLength = 200,
      context = '',
      useAnthropic = false
    } = options;

    try {
      const systemPrompt = `You are a professional newsletter content writer. Create engaging,
well-structured content that matches the specified vibe and tone.

Section type: ${sectionType}
Tone: ${tone.join(', ')}
Target length: ${targetLength} words

Write in a ${tone.join(', ')} style that feels ${vibe.mood?.join(', ') || 'engaging'}.`;

      const userPrompt = `Write a ${sectionType} section about: ${topic}

${context ? `Context: ${context}` : ''}

Vibe: ${JSON.stringify(vibe)}

Requirements:
- ${targetLength} words (approximately)
- Match the vibe and tone
- Include specific, actionable information
- Write for this audience: ${vibe.audience || 'general'}`;

      if (useAnthropic && process.env.ANTHROPIC_API_KEY) {
        // Use Claude for content that benefits from nuanced understanding
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        });

        return message.content[0].text;
      } else {
        // Use GPT-4
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: Math.ceil(targetLength * 1.5)
        });

        return response.choices[0].message.content;
      }

    } catch (error) {
      logger.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Rewrite content in different tone
   * @param {string} content - Original content
   * @param {string} newTone - Target tone
   * @returns {string} Rewritten content
   */
  async rewriteContent(content, newTone, vibe = {}) {
    try {
      const systemPrompt = `You are an expert content editor. Rewrite the provided content
to match a new tone while preserving the core message and information.

Target tone: ${newTone}
Preserve: facts, key points, structure
Change: word choice, sentence structure, style`;

      const userPrompt = `Rewrite this content in a ${newTone} tone:

${content}

Vibe context: ${JSON.stringify(vibe)}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6
      });

      return response.choices[0].message.content;

    } catch (error) {
      logger.error('Error rewriting content:', error);
      throw new Error('Failed to rewrite content');
    }
  }

  /**
   * Generate call-to-action
   * @param {object} options - CTA options
   * @returns {array} Array of CTA options
   */
  async generateCTA(options) {
    const {
      purpose,
      vibe,
      tone = [],
      count = 3
    } = options;

    try {
      const systemPrompt = `You are a conversion copywriter. Create compelling CTAs that drive action.

Return ONLY valid JSON:
{
  "ctas": [
    {
      "text": "CTA text",
      "style": "button|link|text",
      "reasoning": "why this works"
    }
  ]
}`;

      const userPrompt = `Generate ${count} call-to-action options.

Purpose: ${purpose}
Tone: ${tone.join(', ')}
Vibe: ${JSON.stringify(vibe)}

Make them feel ${vibe.mood?.join(', ') || 'compelling'} and ${tone.join(', ')}.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.ctas;

    } catch (error) {
      logger.error('Error generating CTA:', error);
      throw new Error('Failed to generate CTA');
    }
  }

  /**
   * Summarize content (e.g., from RSS feed or blog post)
   * @param {string} content - Content to summarize
   * @param {number} maxLength - Maximum word count
   * @param {object} vibe - Vibe profile
   * @returns {string} Summary
   */
  async summarizeContent(content, maxLength = 100, vibe = {}) {
    try {
      // Check cache first
      const redis = getRedisClient();
      const cacheKey = `summary:${Buffer.from(content).toString('base64').substring(0, 32)}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        logger.info('Returning cached summary');
        return cached;
      }

      const systemPrompt = `You are an expert content summarizer for newsletters.
Create concise, engaging summaries that capture the essence of the content.

Maximum length: ${maxLength} words
Match this vibe: ${JSON.stringify(vibe)}`;

      const userPrompt = `Summarize this content:

${content}

Make it ${vibe.tone?.join(', ') || 'clear and concise'}.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: Math.ceil(maxLength * 1.5)
      });

      const summary = response.choices[0].message.content;

      // Cache for 1 hour
      await redis.setEx(cacheKey, 3600, summary);

      return summary;

    } catch (error) {
      logger.error('Error summarizing content:', error);
      throw new Error('Failed to summarize content');
    }
  }

  /**
   * Generate complete newsletter content
   * @param {object} options - Newsletter options
   * @returns {object} Complete newsletter content
   */
  async generateCompleteNewsletter(options) {
    const {
      vibe,
      topic,
      sections = ['intro', 'main', 'cta'],
      userInput = ''
    } = options;

    try {
      const content = {};

      // Generate headline
      const headlines = await this.generateHeadline({
        topic,
        vibe,
        tone: vibe.tone || [],
        count: 3
      });
      content.headlines = headlines;
      content.selectedHeadline = headlines[0].text;

      // Generate intro
      if (sections.includes('intro')) {
        content.intro = await this.generateContent({
          sectionType: 'introduction',
          topic,
          vibe,
          tone: vibe.tone || [],
          targetLength: 150,
          context: userInput
        });
      }

      // Generate main content sections
      if (sections.includes('main')) {
        content.mainSections = [];
        const mainTopics = this.extractMainTopics(topic, sections.length);

        for (const mainTopic of mainTopics) {
          const section = await this.generateContent({
            sectionType: 'main content',
            topic: mainTopic,
            vibe,
            tone: vibe.tone || [],
            targetLength: 300,
            context: userInput
          });
          content.mainSections.push({
            title: mainTopic,
            content: section
          });
        }
      }

      // Generate CTA
      if (sections.includes('cta')) {
        const ctas = await this.generateCTA({
          purpose: 'engagement',
          vibe,
          tone: vibe.tone || [],
          count: 2
        });
        content.ctas = ctas;
      }

      // Generate closing
      content.closing = await this.generateContent({
        sectionType: 'closing',
        topic: 'thank you and sign off',
        vibe,
        tone: vibe.tone || [],
        targetLength: 100,
        context: userInput
      });

      logger.info('Complete newsletter content generated');
      return content;

    } catch (error) {
      logger.error('Error generating complete newsletter:', error);
      throw error;
    }
  }

  /**
   * Extract main topics from primary topic
   * @param {string} topic - Main topic
   * @param {number} count - Number of subtopics
   * @returns {array} Array of subtopics
   */
  extractMainTopics(topic, count = 3) {
    // Simple extraction - in production, this could use AI
    return [
      `${topic} - Key Update`,
      `${topic} - Featured Story`,
      `${topic} - Quick Tips`
    ].slice(0, count);
  }
}

module.exports = new ContentGenerator();

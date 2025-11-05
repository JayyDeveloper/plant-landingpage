const Template = require('../models/Template');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class TemplateGenerator {
  /**
   * Generate templates based on vibe profile
   * @param {object} vibeProfile - Parsed vibe profile
   * @param {object} designTokens - Design tokens from vibe parser
   * @param {number} count - Number of templates to generate
   * @returns {array} Array of generated templates
   */
  async generateTemplates(vibeProfile, designTokens, count = 3) {
    try {
      const templates = [];

      // Find existing templates that match the vibe
      const matchingTemplates = await this.findMatchingTemplates(vibeProfile);

      if (matchingTemplates.length > 0) {
        // Customize existing templates
        for (let i = 0; i < Math.min(count, matchingTemplates.length); i++) {
          const customized = await this.customizeTemplate(
            matchingTemplates[i],
            designTokens
          );
          templates.push(customized);
        }
      }

      // Generate new templates if needed
      while (templates.length < count) {
        const newTemplate = await this.createNewTemplate(vibeProfile, designTokens);
        templates.push(newTemplate);
      }

      logger.info(`Generated ${templates.length} templates for vibe`);
      return templates;

    } catch (error) {
      logger.error('Error generating templates:', error);
      throw error;
    }
  }

  /**
   * Find templates matching vibe profile
   * @param {object} vibeProfile - Vibe profile
   * @returns {array} Matching templates
   */
  async findMatchingTemplates(vibeProfile) {
    try {
      const query = {
        $or: [
          { 'vibe.mood': { $in: vibeProfile.mood || [] } },
          { 'vibe.tone': { $in: vibeProfile.tone || [] } },
          { tags: { $in: vibeProfile.keywords || [] } }
        ],
        isPublic: true
      };

      const templates = await Template.find(query)
        .sort({ popularityScore: -1 })
        .limit(10)
        .lean();

      return templates;

    } catch (error) {
      logger.error('Error finding matching templates:', error);
      return [];
    }
  }

  /**
   * Customize existing template with new design tokens
   * @param {object} template - Base template
   * @param {object} designTokens - New design tokens
   * @returns {object} Customized template
   */
  async customizeTemplate(template, designTokens) {
    try {
      // Deep clone template
      const customized = JSON.parse(JSON.stringify(template));

      // Apply new design tokens
      customized.designTokens = {
        ...customized.designTokens,
        ...designTokens
      };

      // Update CSS with new colors
      customized.cssStyles = this.replaceDesignTokensInCSS(
        customized.cssStyles,
        designTokens
      );

      // Generate new preview
      customized.preview = {
        thumbnail: `https://placeholder.com/400x300`,
        fullPreview: `https://placeholder.com/800x1200`
      };

      return customized;

    } catch (error) {
      logger.error('Error customizing template:', error);
      throw error;
    }
  }

  /**
   * Create completely new template
   * @param {object} vibeProfile - Vibe profile
   * @param {object} designTokens - Design tokens
   * @returns {object} New template
   */
  async createNewTemplate(vibeProfile, designTokens) {
    try {
      const templateId = uuidv4();
      const layoutType = designTokens.layout?.structure || 'single-column';

      const template = {
        _id: templateId,
        name: `${vibeProfile.style || 'Custom'} - ${layoutType}`,
        description: `A ${vibeProfile.style || 'custom'} template with ${layoutType} layout`,
        vibe: vibeProfile,
        preview: {
          thumbnail: `https://placeholder.com/400x300`,
          fullPreview: `https://placeholder.com/800x1200`
        },
        htmlStructure: this.generateHTML(layoutType, designTokens),
        cssStyles: this.generateCSS(designTokens),
        designTokens: designTokens,
        blocks: this.generateBlocks(layoutType),
        customizable: {
          colors: true,
          fonts: true,
          layout: true
        },
        tags: [
          ...(vibeProfile.mood || []),
          ...(vibeProfile.tone || []),
          vibeProfile.style,
          layoutType
        ].filter(Boolean),
        category: vibeProfile.topic || 'general',
        popularityScore: 0,
        useCount: 0,
        isPublic: true
      };

      return template;

    } catch (error) {
      logger.error('Error creating new template:', error);
      throw error;
    }
  }

  /**
   * Generate HTML structure
   * @param {string} layoutType - Type of layout
   * @param {object} designTokens - Design tokens
   * @returns {string} HTML string
   */
  generateHTML(layoutType, designTokens) {
    const baseHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>{{STYLES}}</style>
</head>
<body>
  <div class="email-container">
    {{BLOCKS}}
  </div>
</body>
</html>`;

    return baseHTML;
  }

  /**
   * Generate CSS from design tokens
   * @param {object} designTokens - Design tokens
   * @returns {string} CSS string
   */
  generateCSS(designTokens) {
    const { colors, typography, layout } = designTokens;

    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${typography?.bodyFont || 'Arial, sans-serif'};
        font-size: ${typography?.bodySize || '16px'};
        line-height: ${typography?.lineHeight || 1.6};
        color: ${colors?.text || '#333333'};
        background-color: ${colors?.background || '#FFFFFF'};
      }

      .email-container {
        max-width: ${layout?.maxWidth || '600px'};
        margin: 0 auto;
        padding: ${layout?.padding || '20px'};
      }

      h1, h2, h3 {
        font-family: ${typography?.headingFont || 'Georgia, serif'};
        color: ${colors?.primary || '#000000'};
        margin-bottom: 16px;
      }

      h1 {
        font-size: ${typography?.headingSize || '32px'};
      }

      .block {
        margin-bottom: ${layout?.blockSpacing || '24px'};
      }

      .hero {
        text-align: center;
        padding: 40px 20px;
        background-color: ${colors?.primary || '#000000'};
        color: #FFFFFF;
      }

      .content-block {
        padding: 20px;
      }

      .cta-button {
        display: inline-block;
        padding: 12px 24px;
        background-color: ${colors?.accent || colors?.primary || '#007bff'};
        color: #FFFFFF;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      }

      .divider {
        height: 1px;
        background-color: ${colors?.secondary || '#CCCCCC'};
        margin: 24px 0;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      @media only screen and (max-width: 600px) {
        .email-container {
          padding: 10px;
        }
        h1 {
          font-size: 24px;
        }
      }
    `.trim();
  }

  /**
   * Generate block definitions
   * @param {string} layoutType - Layout type
   * @returns {array} Array of block definitions
   */
  generateBlocks(layoutType) {
    const blocks = [
      {
        id: 'header',
        type: 'header',
        name: 'Newsletter Header',
        defaultContent: {
          logo: '',
          tagline: ''
        },
        customizable: true,
        styles: {}
      },
      {
        id: 'hero',
        type: 'hero',
        name: 'Hero Section',
        defaultContent: {
          headline: 'Your Headline Here',
          subheadline: 'Your subheadline here',
          image: ''
        },
        customizable: true,
        styles: {}
      },
      {
        id: 'content-1',
        type: 'content',
        name: 'Content Section 1',
        defaultContent: {
          title: 'Section Title',
          body: 'Your content here',
          image: ''
        },
        customizable: true,
        styles: {}
      },
      {
        id: 'content-2',
        type: 'content',
        name: 'Content Section 2',
        defaultContent: {
          title: 'Section Title',
          body: 'Your content here',
          image: ''
        },
        customizable: true,
        styles: {}
      },
      {
        id: 'cta',
        type: 'cta',
        name: 'Call to Action',
        defaultContent: {
          text: 'Click Here',
          url: '#',
          buttonStyle: 'primary'
        },
        customizable: true,
        styles: {}
      },
      {
        id: 'footer',
        type: 'footer',
        name: 'Footer',
        defaultContent: {
          text: 'Thanks for reading!',
          socialLinks: [],
          unsubscribeLink: '{{unsubscribe_url}}'
        },
        customizable: true,
        styles: {}
      }
    ];

    return blocks;
  }

  /**
   * Replace design tokens in CSS
   * @param {string} css - Original CSS
   * @param {object} designTokens - New design tokens
   * @returns {string} Updated CSS
   */
  replaceDesignTokensInCSS(css, designTokens) {
    let updatedCSS = css;

    if (designTokens.colors) {
      Object.entries(designTokens.colors).forEach(([key, value]) => {
        // This is a simple replacement - in production, use a CSS parser
        const patterns = {
          primary: /#[0-9A-Fa-f]{6}/g,
          secondary: /#[0-9A-Fa-f]{6}/g,
          accent: /#[0-9A-Fa-f]{6}/g,
        };

        if (patterns[key]) {
          updatedCSS = updatedCSS.replace(patterns[key], value);
        }
      });
    }

    return updatedCSS;
  }

  /**
   * Save template to database
   * @param {object} template - Template to save
   * @returns {object} Saved template
   */
  async saveTemplate(template) {
    try {
      const templateDoc = new Template(template);
      await templateDoc.save();
      logger.info(`Template saved: ${template._id}`);
      return templateDoc;
    } catch (error) {
      logger.error('Error saving template:', error);
      throw error;
    }
  }
}

module.exports = new TemplateGenerator();

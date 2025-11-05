const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  vibe: {
    mood: [String],
    tone: [String],
    style: String,
    audience: String
  },
  preview: {
    thumbnail: String,
    fullPreview: String
  },
  htmlStructure: {
    type: String,
    required: true
  },
  cssStyles: {
    type: String,
    required: true
  },
  designTokens: {
    colors: {
      primary: String,
      secondary: String,
      accent: String,
      background: String,
      text: String
    },
    typography: {
      headingFont: String,
      bodyFont: String,
      headingSize: String,
      bodySize: String,
      lineHeight: Number
    },
    layout: {
      structure: String,
      maxWidth: String,
      padding: String,
      blockSpacing: String
    }
  },
  blocks: [{
    id: String,
    type: String,
    name: String,
    defaultContent: mongoose.Schema.Types.Mixed,
    customizable: {
      type: Boolean,
      default: true
    },
    styles: mongoose.Schema.Types.Mixed
  }],
  customizable: {
    colors: {
      type: Boolean,
      default: true
    },
    fonts: {
      type: Boolean,
      default: true
    },
    layout: {
      type: Boolean,
      default: true
    }
  },
  tags: [String],
  category: String,
  popularityScore: {
    type: Number,
    default: 0
  },
  useCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
templateSchema.index({ 'vibe.mood': 1 });
templateSchema.index({ 'vibe.tone': 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ popularityScore: -1 });
templateSchema.index({ useCount: -1 });

module.exports = mongoose.model('Template', templateSchema);

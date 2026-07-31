import mongoose from 'mongoose';

const whatsappTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: Number,
    default: 1,
    required: true
  },
  language: {
    type: String,
    default: 'en_US'
  },
  components: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  fallbackText: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure combination of templateName and version is unique
whatsappTemplateSchema.index({ templateName: 1, version: -1 }, { unique: true });

const WhatsAppTemplate = mongoose.model('WhatsAppTemplate', whatsappTemplateSchema);

export default WhatsAppTemplate;

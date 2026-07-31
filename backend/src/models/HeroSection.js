import mongoose from 'mongoose';

const heroSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Master CA with Expert Guidance'
  },
  subtitle: {
    type: String,
    required: true,
    default: 'Join thousands of students achieving their CA dreams'
  },
  description: {
    type: String,
    default: 'Comprehensive courses for CA Foundation, Intermediate, and Final'
  },
  ctaText: {
    type: String,
    default: 'Explore Courses'
  },
  ctaLink: {
    type: String,
    default: '/courses'
  },
  secondaryCtaText: {
    type: String,
    default: 'Watch Demo'
  },
  secondaryCtaLink: {
    type: String,
    default: '#demo'
  },
  demoVideoUrl: {
    type: String,
    default: ''
  },
  demoVideoTitle: {
    type: String,
    default: 'Welcome to SHRI Educational World'
  },
  demoVideoDescription: {
    type: String,
    default: 'Discover how our platform helps thousands of students achieve their CA dreams with expert guidance and comprehensive courses.'
  },
  bannerImage: {
    url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200'
    },
    publicId: String
  },
  offerText: {
    type: String,
    default: '🎉 Limited Time Offer: Get 30% OFF on all courses!'
  },
  showOffer: {
    type: Boolean,
    default: true
  },
  features: [{
    icon: String,
    title: String,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const HeroSection = mongoose.model('HeroSection', heroSectionSchema);

export default HeroSection;

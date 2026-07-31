import crypto from 'crypto';
import jwt from 'jsonwebtoken';

class JitsiProvider {
  generateMeeting(courseTitle) {
    // Sanitize course title (alphanumeric and dashes only)
    const sanitizedTitle = courseTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 25);
    
    // Generate cryptographically secure random bytes to prevent predictable URLs
    const randomHex = crypto.randomBytes(6).toString('hex');
    const roomId = `ca-${sanitizedTitle}-${randomHex}`;
    
    return {
      roomId,
      provider: 'jitsi',
      metadata: {
        domain: process.env.JITSI_DOMAIN || 'meet.jit.si'
      }
    };
  }

  getUrl(roomId) {
    const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    return `https://${domain}/${roomId}`;
  }

  generateToken(roomId, user, isModerator) {
    const secret = process.env.JITSI_JWT_SECRET;
    if (!secret) return null;

    const appId = process.env.JITSI_APP_ID || 'my-jitsi-app';
    const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';

    const payload = {
      aud: appId,
      iss: appId,
      sub: domain,
      room: roomId,
      context: {
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || 'https://res.cloudinary.com/demo/image/upload/avatar-placeholder.png'
        },
        features: {
          recording: isModerator,
          livestreaming: isModerator,
          'screen-sharing': true
        }
      },
      affiliation: isModerator ? 'owner' : 'member',
      moderator: isModerator,
      exp: Math.floor(Date.now() / 1000) + 4 * 3600 // Valid for 4 hours
    };

    // Detect if key is private key (JaaS or RSA-authenticated self-hosted instances)
    const isPrivateKey = secret.includes('BEGIN PRIVATE KEY') || secret.includes('BEGIN RSA PRIVATE KEY') || secret.includes('BEGIN KEY');
    const algorithm = isPrivateKey ? 'RS256' : 'HS256';

    if (isPrivateKey) {
      payload.aud = 'jitsi';
      payload.iss = 'chat';
      payload.sub = appId;
    }

    return jwt.sign(payload, secret, { algorithm });
  }
}

class MeetingManager {
  constructor() {
    this.providers = {
      jitsi: new JitsiProvider()
      // Other providers can be registered here in the future, e.g. zoom, daily
    };
    this.defaultProvider = process.env.MEETING_PROVIDER || 'jitsi';
  }

  generateMeeting(courseTitle, providerName = this.defaultProvider) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Meeting provider "${providerName}" not found`);
    }
    return provider.generateMeeting(courseTitle);
  }

  getUrl(roomId, providerName = this.defaultProvider) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Meeting provider "${providerName}" not found`);
    }
    return provider.getUrl(roomId);
  }

  generateToken(roomId, user, isModerator, providerName = this.defaultProvider) {
    const provider = this.providers[providerName];
    if (provider && typeof provider.generateToken === 'function') {
      return provider.generateToken(roomId, user, isModerator);
    }
    return null;
  }
}

export const meetingManager = new MeetingManager();
export default meetingManager;

import { useEffect, useRef, useState } from 'react';
import { Spinner } from './ui/Primitives';
import { AlertCircle } from 'lucide-react';

export default function LiveMeetingEmbed({ 
  meetingLink, 
  user, 
  role, 
  jwt,
  onLeave, 
  onReady 
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiInstance, setApiInstance] = useState(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // Extract the room name from the meetingLink.
  // The meetingLink could be a full URL (https://meet.jit.si/room-name) or just the room name.
  const getRoomName = (link) => {
    if (!link) return '';
    if (link.startsWith('http')) {
      try {
        const url = new URL(link);
        return url.pathname.replace(/^\//, '');
      } catch (e) {
        return link;
      }
    }
    return link;
  };

  const getDomain = (link) => {
    if (link && link.startsWith('http')) {
      try {
        const url = new URL(link);
        return url.host;
      } catch (e) {
        return 'meet.jit.si';
      }
    }
    return 'meet.jit.si';
  };

  useEffect(() => {
    const roomName = getRoomName(meetingLink);
    const domain = getDomain(meetingLink);

    if (!roomName) {
      setError('Invalid meeting link or room name');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let api = null;

    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      try {
        setLoading(false);
        
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: user?.name || 'User',
            email: user?.email || ''
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableInviteFunctions: true, // Hide invite links for privacy
            prejoinPageEnabled: false,    // Skip prejoin for seamless loading
            defaultLanguage: 'en',
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            MOBILE_APP_PROMO: false,
          }
        };

        // Determine if teacher/admin should have moderator settings
        const isModerator = role === 'teacher' || role === 'admin';
        if (isModerator) {
          // Extra configurations for hosts/moderators
          options.configOverwrite.buttonsWithSharePlayOption = [];
        }

        if (jwt) {
          options.jwt = jwt;
        }

        api = new window.JitsiMeetExternalAPI(domain, options);
        setApiInstance(api);

        if (onReady) onReady();

        // Listen for conference join
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Successfully joined Jitsi video conference');
        });

        // Listen for leaving
        api.addEventListener('videoConferenceLeft', () => {
          console.log('User left Jitsi video conference');
          if (onLeave) onLeave();
        });

        // Handle error states
        api.addEventListener('cameraError', (err) => console.warn('Camera Error:', err));
        api.addEventListener('micError', (err) => console.warn('Mic Error:', err));

      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
        setUseIframeFallback(true);
        setLoading(false);
      }
    };

    // Load Jitsi external script dynamically if not present
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        if (isMounted) initJitsi();
      };
      script.onerror = () => {
        if (isMounted) {
          console.warn('Jitsi script load failed, falling back to direct iframe embed');
          setUseIframeFallback(true);
          setLoading(false);
        }
      };
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      isMounted = false;
      if (api) {
        console.log('Disposing Jitsi instance...');
        api.dispose();
      }
    };
  }, [meetingLink, user, role, jwt]);

  const roomName = getRoomName(meetingLink);
  const domain = getDomain(meetingLink);
  const iframeUrl = `https://${domain}/${roomName}`;

  if (useIframeFallback) {
    return (
      <div className="relative w-full h-[600px] bg-neutral-950 rounded-2xl overflow-hidden border border-border flex flex-col animate-fade-in">
        {/* Helper Header Bar */}
        <div className="bg-neutral-900 border-b border-border/40 px-4 py-2.5 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Compatibility Mode (Microphone/Camera permission might require new window)</span>
          </div>
          <div className="flex gap-2">
            <a 
              href={iframeUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-white rounded font-bold transition flex items-center gap-1 cursor-pointer"
            >
              Open in New Tab
            </a>
            <button 
              onClick={onLeave} 
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
        
        {/* Fallback iframe */}
        <div className="flex-1 w-full bg-black">
          <iframe
            src={iframeUrl}
            allow="camera *; microphone *; display-capture *; autoplay *; clipboard-write *; fullscreen *"
            allowFullScreen={true}
            className="w-full h-full border-0"
            title="Jitsi Meeting Room"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-neutral-950 rounded-2xl overflow-hidden border border-border flex flex-col items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col justify-center items-center gap-3 bg-neutral-900 z-10 text-white">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-400 font-medium font-sans">Connecting to live lecture room...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 bg-neutral-900 p-6 z-10 text-center text-white">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/25">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Meeting Connection Error</h3>
            <p className="text-sm text-neutral-400 max-w-sm">{error}</p>
          </div>
          <button 
            onClick={onLeave} 
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Go Back
          </button>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

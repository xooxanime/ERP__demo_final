import { FiX, FiPlay, FiAlertCircle } from 'react-icons/fi';

const DemoVideoModal = ({ isOpen, onClose, videoData }) => {
  if (!isOpen) return null;

  const hasVideo = videoData?.demoVideoUrl && videoData.demoVideoUrl.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-card text-card-foreground border border-border rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all"
          >
            <FiX className="w-6 h-6" />
          </button>

          {hasVideo ? (
            <>
              {/* Video Container */}
              <div className="relative pt-[56.25%]">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={videoData.demoVideoUrl}
                  title={videoData.demoVideoTitle || 'Demo Video'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Video Info */}
              <div className="p-6 bg-card">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {videoData.demoVideoTitle || 'Welcome to SHRI Educational World'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {videoData.demoVideoDescription || 'Discover how our platform helps thousands of students achieve their CA dreams with expert guidance and comprehensive courses.'}
                </p>
              </div>
            </>
          ) : (
            /* No Video Available */
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
                <FiAlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Demo Video Not Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The demo video is currently being updated. Please check back soon or contact us for more information.
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoVideoModal;


import React from 'react';
import { VoiceAssistantStatus } from '../types';

interface VoiceControlButtonProps {
  onClick: () => void; // For start/stop/interrupt listening when feature is enabled
  onToggleGlobal: () => void; // For toggling the global enabled state of the feature
  status: VoiceAssistantStatus;
  isGloballyEnabled: boolean; 
}

// Icon for when the voice feature is globally disabled. Copied from Header and resized.
const VoiceOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" {...props}> {/* Adjusted size to w-6 h-6 */}
   <path d="M7.5 9a3.5 3.5 0 017 0v2.091a3.504 3.504 0 01-1.223 2.716l.87.87A4.992 4.992 0 0015.5 11.09V9a5 5 0 00-9.308-2.527l.87.87A3.5 3.5 0 017.5 9zM3.662 3.557a.75.75 0 00-1.06 1.061l16.51 16.51a.75.75 0 001.06-1.06L3.662 3.557zM8.72 16.14a3.486 3.486 0 01-1.222-2.716A.75.75 0 006 13.5v-1.159a4.988 4.988 0 002.099 4.312l-.87-.87a3.534 3.534 0 01-.509-.655z" />
   <path d="M11 17.092a3.488 3.488 0 012.316-3.216l.87.87A4.988 4.988 0 0014 13.5v-1.159a.75.75 0 00-1.5 0V13.5a3.504 3.504 0 01-1.223 2.716l-.87-.87c.18-.146.344-.31.491-.492z" />
 </svg>
 );

const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c-2.485 0-4.5-2.015-4.5-4.5V5.25c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5v5.25c0 2.485-2.015 4.5-4.5 4.5z" />
  </svg>
);

// Icon for when voice is enabled but there's an error, or specifically disabled by an error.
const MicrophoneSlashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c-2.485 0-4.5-2.015-4.5-4.5V5.25c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5v5.25c0 2.485-2.015 4.5-4.5 4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

const ListeningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" {...props}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75A.75.75 0 016 10.5zM12 18.75a.75.75 0 00.75-.75V16.5a.75.75 0 00-1.5 0v1.5a.75.75 0 00.75.75z" />
    </svg>
);


export const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({ 
    onClick, 
    onToggleGlobal, 
    status, 
    isGloballyEnabled 
}) => {
  let icon;
  let title;
  let currentOnClickHandler = onClick;
  let buttonColor = "text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-primary";
  let isDisabled = false;

  if (!isGloballyEnabled) {
    icon = <VoiceOffIcon />;
    title = "Voice assistant disabled. Click to enable.";
    currentOnClickHandler = onToggleGlobal;
    buttonColor = "text-slate-400 dark:text-slate-500 hover:text-green-500 dark:hover:text-green-400"; // Indicate it can be enabled
  } else {
    // Feature is globally enabled
    switch (status) {
      case 'listening':
        icon = <ListeningIcon className="text-primary animate-pulse" />;
        title = "Listening... Click to stop";
        buttonColor = "text-primary";
        break;
      case 'processing':
        icon = <ListeningIcon className="text-yellow-500" />; // No pulse or different icon for processing
        title = "Processing...";
        buttonColor = "text-yellow-500";
        isDisabled = true; // Typically disabled during processing
        break;
      case 'speaking':
        icon = <ListeningIcon className="text-blue-500" />; // No pulse or different icon/color for speaking
        title = "Speaking... Click to interrupt";
        buttonColor = "text-blue-500";
        // onClick (handleVoiceControlClick) should handle interrupting speech
        break;
      case 'error':
        icon = <MicrophoneSlashIcon />;
        title = "Voice assistant error. Click to retry.";
        buttonColor = "text-red-500 dark:text-red-400";
        // onClick (handleVoiceControlClick) should attempt to restart listening
        break;
      case 'disabled': 
        // This 'disabled' status, when isGloballyEnabled is true, implies an issue or temporary unavailability.
        icon = <MicrophoneSlashIcon />;
        title = "Voice assistant temporarily unavailable or error.";
        buttonColor = "text-red-500 dark:text-red-400";
        isDisabled = true; 
        break;
      case 'idle':
      default:
        icon = <MicrophoneIcon />;
        title = "Activate Voice Command";
        break;
    }
  }

  return (
    <button
      onClick={currentOnClickHandler}
      disabled={isDisabled}
      className={`p-2 rounded-full transition-colors duration-150 ${buttonColor} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={title}
      title={title}
    >
      {icon}
    </button>
  );
};

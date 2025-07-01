
import React from 'react';
import { ORGANIZATION_NAME_SHORT, ORGANIZATION_LOGO_URL } from '../constants';
import { type Theme } from '../App'; // Assuming Theme type is exported from App.tsx
import { VoiceControlButton } from './VoiceControlButton';
import { VoiceAssistantStatus } from '../types';

interface HeaderProps {
  currentTheme: Theme;
  toggleTheme: () => void;
  voiceStatus: VoiceAssistantStatus;
  isVoiceAssistantGloballyEnabled: boolean;
  onVoiceControlClick: () => void; // For start/stop listening when enabled
  onToggleVoiceAssistantGlobal: () => void; // For global enable/disable
}

const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

// VoiceOffIcon and VoiceOnIcon are removed from here. VoiceOffIcon will be in VoiceControlButton.

export const Header: React.FC<HeaderProps> = ({ 
  currentTheme, 
  toggleTheme, 
  voiceStatus,
  isVoiceAssistantGloballyEnabled,
  onVoiceControlClick,
  onToggleVoiceAssistantGlobal 
}) => {
  return (
    <header className="bg-white dark:bg-secondary shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <img src={ORGANIZATION_LOGO_URL} alt={`${ORGANIZATION_NAME_SHORT} Logo`} className="h-10 sm:h-12 mr-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-secondary dark:text-primary">{ORGANIZATION_NAME_SHORT}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-text-secondary hidden md:block">Predictive Readmission Risk</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <VoiceControlButton 
            onClick={onVoiceControlClick} 
            onToggleGlobal={onToggleVoiceAssistantGlobal}
            status={voiceStatus} 
            isGloballyEnabled={isVoiceAssistantGloballyEnabled} 
          />
          <button
            onClick={toggleTheme}
            aria-label={currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            className="p-2 rounded-full text-secondary dark:text-primary hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors duration-150"
          >
            {currentTheme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </header>
  );
};

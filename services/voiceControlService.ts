
// @ts-nocheck
// Disabling TypeScript checks for this file due to Web Speech API types not always being standard in all TS lib versions.
import { VoiceCommand, VoiceCommandAction, VoiceAssistantStatus } from '../types';

type StatusUpdateCallback = (status: VoiceAssistantStatus, message?: string) => void;
type CommandCallback = (command: VoiceCommand) => void;

export class VoiceControlService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private onCommandReceived: CommandCallback;
  private onStatusUpdate: StatusUpdateCallback;
  private isSupported: boolean = false;
  private currentLang: string = 'en-US'; // Default language

  constructor(onCommandReceived: CommandCallback, onStatusUpdate: StatusUpdateCallback) {
    this.onCommandReceived = onCommandReceived;
    this.onStatusUpdate = onStatusUpdate;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Process single commands
      this.recognition.interimResults = true; // Get interim results for faster feedback
      this.recognition.lang = this.currentLang;

      this.recognition.onstart = () => this.onStatusUpdate('listening');
      this.recognition.onresult = this.handleRecognitionResult; // No .bind(this) needed for arrow functions
      this.recognition.onerror = this.handleRecognitionError;   // No .bind(this) needed for arrow functions
      this.recognition.onend = () => {
        // Status might already be 'processing' or 'error', don't override if so.
        // If it's still 'listening', it means it timed out or stopped naturally.
        // App.tsx's handleVoiceCommand logic often resets to 'idle' after processing.
      };
      this.isSupported = true;
    } else {
      this.onStatusUpdate('error', 'Speech recognition is not supported by your browser.');
      this.isSupported = false;
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }
  
  public startListening(): void {
    if (!this.recognition || !this.isSupported) {
      this.onStatusUpdate('error', 'Cannot start listening: Speech recognition not available.');
      return;
    }
    try {
      // Ensure not already listening or in a state that prevents starting
      if (this.synthesis.speaking) { // Don't listen while speaking
           this.onStatusUpdate('speaking', "Please wait until I finish speaking."); // Or 'idle'
           return;
      }
      this.recognition.start();
    } catch (e) {
      // Handle cases where recognition might already be active or other errors.
      console.error("Error starting speech recognition:", e);
      if (e.name === 'InvalidStateError') {
        // Already started or starting, this is fine or browser handles it.
        // Forcing a stop then start can be jerky. Let onend handle natural transitions.
      } else {
        this.onStatusUpdate('error', 'Could not start voice recognition.');
      }
    }
  }

  public stopListening(): void {
    if (!this.recognition || !this.isSupported) return;
    try {
        this.recognition.stop();
    } catch(e) {
        console.warn("Error stopping speech recognition (it might have already stopped):", e);
    }
    // onStatusUpdate to 'idle' or 'processing' will be handled by onend or in App.tsx
  }

  private handleRecognitionResult = (event: SpeechRecognitionEvent): void => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    this.onStatusUpdate('processing', interimTranscript || finalTranscript); 

    if (finalTranscript) {
      const command = this.parseCommand(finalTranscript.trim().toLowerCase());
      this.onCommandReceived(command);
    }
  }

  private handleRecognitionError = (event: SpeechRecognitionErrorEvent): void => {
    console.error("Speech recognition error:", event.error, event.message);
    let message = `Speech recognition error: ${event.error}.`;
    if (event.error === 'no-speech') {
        message = "No speech detected. Please try again.";
    } else if (event.error === 'audio-capture') {
        message = "Audio capture failed. Ensure microphone is enabled and working.";
    } else if (event.error === 'not-allowed') {
        message = "Microphone access denied. Please allow microphone permission.";
    }
    this.onStatusUpdate('error', message);
  }

  public speak(text: string, onEndCallback?: () => void): void {
    if (!this.synthesis || !text) return;
    
    if (this.synthesis.speaking) {
      this.synthesis.cancel(); 
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.currentLang;
    utterance.onstart = () => this.onStatusUpdate('speaking', text);
    utterance.onend = () => {
      this.onStatusUpdate('idle'); 
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => { 
        const utteranceText = event.utterance ? event.utterance.text : "unknown utterance";
        if (event.error === 'interrupted' || event.error === 'canceled') {
            console.info(`Speech synthesis event: ${event.error} for utterance: "${utteranceText}". This is often normal (e.g., new speech started, or speech was manually stopped/cancelled).`);
            // Do not call onStatusUpdate('error', ...) as 'onend' will typically fire and set status to idle.
            // If another speech starts immediately, its 'onstart' will set status to 'speaking'.
        } else {
            console.error(`Speech synthesis error: ${event.error}. Utterance: "${utteranceText}"`);
            this.onStatusUpdate('error', `Sorry, I couldn't speak. Error: ${event.error}`);
        }
    };
    this.synthesis.speak(utterance);
  }

  private parseCommand(transcript: string): VoiceCommand {
    console.log("Parsing transcript:", transcript);
    if (transcript.includes("navigate to single") || transcript.includes("go to single")) {
      return { action: 'NAVIGATE', target: 'single' };
    }
    if (transcript.includes("navigate to batch") || transcript.includes("go to batch")) {
      return { action: 'NAVIGATE', target: 'batch' };
    }
    if (transcript.includes("navigate to dashboard") || transcript.includes("go to dashboard") || transcript.includes("show dashboard") || transcript.includes("show insights")) {
      return { action: 'NAVIGATE', target: 'dashboard' };
    }
    if (transcript.startsWith("set age to")) {
      const value = transcript.replace("set age to", "").trim();
      if (value && !isNaN(parseInt(value))) return { action: 'FILL_FIELD', target: 'demographics.age', value: parseInt(value) };
    }
    if (transcript.startsWith("set gender to")) {
      const value = transcript.replace("set gender to", "").trim();
      if (['male', 'female', 'other'].includes(value)) return { action: 'FILL_FIELD', target: 'demographics.gender', value: value.charAt(0).toUpperCase() + value.slice(1) as 'Male' | 'Female' | 'Other' };
    }
    if (transcript.startsWith("set diagnosis codes to")) {
      const value = transcript.replace("set diagnosis codes to", "").trim();
      return { action: 'FILL_FIELD', target: 'medicalHistory.diagnosisCodes', value: value };
    }
    if (transcript.startsWith("set support system to")) {
        const value = transcript.replace("set support system to", "").trim();
        if (['yes', 'no'].includes(value)) {
            return { action: 'FILL_FIELD', target: 'socialDeterminants.hasSupportSystem', value: value.charAt(0).toUpperCase() + value.slice(1) as 'Yes' | 'No'};
        }
    }


    if (transcript.includes("submit form") || transcript.includes("predict now") || transcript.includes("get prediction")) {
      return { action: 'SUBMIT_FORM' };
    }
    if (transcript.includes("clear form") || transcript.includes("reset form")) {
      return { action: 'CLEAR_FORM' };
    }
    if (transcript.includes("toggle theme") || transcript.includes("change theme") || transcript.includes("switch theme")) {
      return { action: 'TOGGLE_THEME' };
    }
    if (transcript.includes("read prediction") || transcript.includes("what's the risk") || transcript.includes("tell me the result")) {
      return { action: 'READ_PREDICTION' };
    }
    if (transcript.includes("enable voice") || transcript.includes("turn on voice")) {
        return { action: 'TOGGLE_VOICE_ASSISTANT', value: 'enable'};
    }
    if (transcript.includes("disable voice") || transcript.includes("turn off voice")) {
        return { action: 'TOGGLE_VOICE_ASSISTANT', value: 'disable'};
    }

    const fillFieldMatch = transcript.match(/^set (.*?) to (.*)$/);
    if (fillFieldMatch) {
        const fieldPhrase = fillFieldMatch[1].toLowerCase();
        const fieldValue = fillFieldMatch[2];
        const fieldMappings: Record<string, string> = {
            // "ethnicity": "demographics.ethnicity", // Removed
            "previous admissions": "medicalHistory.previousAdmissions",
            "length of stay": "medicalHistory.lengthOfStayDays",
            "treatment summary": "medicalHistory.treatmentSummary",
            "lab results": "labResults.keyLabResultsText",
            "housing situation": "socialDeterminants.housingSituation",
        };
        if (fieldMappings[fieldPhrase]) {
             let processedValue: string | number = fieldValue;
            if (['medicalHistory.previousAdmissions', 'medicalHistory.lengthOfStayDays'].includes(fieldMappings[fieldPhrase]) && !isNaN(parseFloat(fieldValue))) {
                processedValue = parseFloat(fieldValue);
            }
             if (fieldMappings[fieldPhrase] === 'socialDeterminants.housingSituation' && ['stable', 'unstable', 'homeless'].includes(fieldValue.toLowerCase())) {
                processedValue = fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1).toLowerCase();
            }

            return { action: 'FILL_FIELD', target: fieldMappings[fieldPhrase], value: processedValue };
        }
    }


    return { action: 'UNKNOWN', target: transcript };
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }
}
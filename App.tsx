
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PatientDataForm } from './components/PatientDataForm';
import { PredictionResultDisplay } from './components/PredictionResultDisplay';
import { BatchUploadForm } from './components/BatchUploadForm';
import { InsightsDashboard } from './components/InsightsDashboard';
import { PatientProfileModal } from './components/PatientProfileModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AlertPopup } from './components/AlertPopup';
import { PatientData, PredictionOutput, AppTab, PatientDataInput, VoiceCommand, VoiceAssistantStatus } from './types';
import { generateMockPatient, generateMockPredictionOutput } from './utils/mockData';
import { 예측_결과_가져오기 } from './services/geminiService';
import { VoiceControlService } from './services/voiceControlService';

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('single');
  const [patientInput, setPatientInput] = useState<PatientDataInput>(generateMockPatient().data);
  const [singlePrediction, setSinglePrediction] = useState<PredictionOutput | null>(null);
  const [batchPatients, setBatchPatients] = useState<PatientData[]>([]);
  const [batchPredictions, setBatchPredictions] = useState<Map<string, PredictionOutput>>(new Map());
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<PatientData | null>(null);
  const [selectedPredictionForProfile, setSelectedPredictionForProfile] = useState<PredictionOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme) return storedTheme;
    }
    return 'dark';
  });

  // Voice Assistant State
  const [isVoiceAssistantGloballyEnabled, setIsVoiceAssistantGloballyEnabled] = useState<boolean>(() => {
     if (typeof window !== 'undefined') {
        return localStorage.getItem('voiceAssistantEnabled') === 'true';
     }
     return false;
  });
  const [voiceStatus, setVoiceStatus] = useState<VoiceAssistantStatus>(isVoiceAssistantGloballyEnabled ? 'idle' : 'disabled');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const voiceServiceRef = useRef<VoiceControlService | null>(null);
  const patientFormRef = useRef<{ clearForm: () => void }>(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        voiceServiceRef.current = new VoiceControlService(handleVoiceCommand, handleVoiceStatusUpdate);
        if (!voiceServiceRef.current.getIsSupported()) {
            setIsVoiceAssistantGloballyEnabled(false);
            setVoiceStatus('error');
            setVoiceTranscript("Voice recognition not supported by your browser.");
        } else if (!isVoiceAssistantGloballyEnabled) {
            setVoiceStatus('disabled'); // Explicitly set to 'disabled' matching VoiceControlButton logic
        } else {
            setVoiceStatus('idle'); // If supported and enabled, start as idle
        }
    }
    return () => {
      if (voiceServiceRef.current && voiceServiceRef.current.isSpeaking()) {
        speechSynthesis.cancel(); // Stop any speech on unmount
      }
      // Consider stopping listening if active: voiceServiceRef.current?.stopListening();
    }
  }, [isVoiceAssistantGloballyEnabled]); // Re-init if globally enabled state changes. 

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (isVoiceAssistantGloballyEnabled && voiceServiceRef.current) {
      voiceServiceRef.current.speak(text, onEnd);
    }
  }, [isVoiceAssistantGloballyEnabled]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
      speak(`Theme changed to ${newTheme} mode.`);
      return newTheme;
    });
  }, [speak]);

  const handlePredict = useCallback(async (data: PatientDataInput) => {
    setIsLoading(true);
    setError(null);
    setSinglePrediction(null);
    try {
      const result = await 예측_결과_가져오기(data); 
      // const result = generateMockPredictionOutput(); 
      setSinglePrediction(result);
      speak(`Prediction successful. The readmission risk is ${result.riskPercentage} percent.`);
      if (result.riskPercentage > 70) {
        setAlertMessage(`High Readmission Risk: ${result.riskPercentage}% for patient (using current input).`);
      }
    } catch (err) {
      console.error("Prediction error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during prediction.';
      setError(errorMessage);
      speak(`Prediction failed. ${errorMessage}`);
      setSinglePrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [speak]);

  const handleVoiceStatusUpdate = useCallback((status: VoiceAssistantStatus, message?: string) => {
    // Only update status if globally enabled, or if it's an error/disabled status from service init
    if (isVoiceAssistantGloballyEnabled || ['error', 'disabled'].includes(status)) {
        setVoiceStatus(status);
    }
    if (message) setVoiceTranscript(message);
  }, [isVoiceAssistantGloballyEnabled]);

  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    if (!isVoiceAssistantGloballyEnabled) return;

    console.log("Received command in App:", command);
    setVoiceTranscript(`Command: ${command.action} ${command.target || ''} ${command.value || ''}`);

    switch (command.action) {
      case 'NAVIGATE':
        if (command.target && ['single', 'batch', 'dashboard'].includes(command.target)) {
          setActiveTab(command.target as AppTab);
          speak(`Navigating to ${command.target} tab.`);
        } else {
          speak(`Sorry, I cannot navigate to ${command.target}.`);
        }
        break;
      case 'FILL_FIELD':
        if (activeTab === 'single' && command.target && command.value !== undefined) {
          const [section, key] = command.target.split('.') as [keyof PatientDataInput, string];
          if (section && key && patientInput.hasOwnProperty(section) && (patientInput[section] as any).hasOwnProperty(key)) {
            setPatientInput(prev => {
              const updatedSection = { ...prev[section], [key]: command.value };
              return { ...prev, [section]: updatedSection };
            });
            speak(`${key.replace(/([A-Z])/g, ' $1')} set to ${command.value}.`);
          } else {
             speak(`Sorry, I cannot set the field ${command.target}.`);
          }
        } else {
          speak("Please navigate to the single prediction form to fill fields.");
        }
        break;
      case 'SUBMIT_FORM':
        if (activeTab === 'single') {
          speak("Submitting form for prediction.");
          handlePredict(patientInput);
        } else {
          speak("Please navigate to the single prediction form to submit.");
        }
        break;
      case 'CLEAR_FORM':
        if (activeTab === 'single') {
            const clearedData: PatientDataInput = {
              demographics: { age: '', gender: '' }, // Ethnicity removed
              medicalHistory: { diagnosisCodes: '', previousAdmissions: '', lengthOfStayDays: '', treatmentSummary: '' },
              labResults: { keyLabResultsText: '' },
              socialDeterminants: { hasSupportSystem: '', housingSituation: '' },
            };
            setPatientInput(clearedData);
            speak("Form cleared.");
        } else {
            speak("No form to clear on this tab.");
        }
        break;
      case 'TOGGLE_THEME':
        toggleTheme();
        break;
      case 'READ_PREDICTION':
        if (activeTab === 'single' && singlePrediction) {
          speak(`The predicted readmission risk is ${singlePrediction.riskPercentage} percent. Key risk drivers are: ${singlePrediction.keyRiskDrivers.join(', ')}. Proactive recommendations include: ${singlePrediction.proactiveRecommendations.join(', ')}.`);
        } else if (activeTab === 'single' && !singlePrediction) {
          speak("No prediction available to read. Please submit the form first.");
        } 
        else {
          speak("Prediction reading is available on the single prediction tab after a prediction is made.");
        }
        break;
      // TOGGLE_VOICE_ASSISTANT command might be obsolete if VoiceControlButton handles this via onToggleGlobal
      // However, keeping it allows voice commands like "disable voice"
      case 'TOGGLE_VOICE_ASSISTANT': 
        const enabling = command.value === 'enable';
        setIsVoiceAssistantGloballyEnabled(enabling);
        localStorage.setItem('voiceAssistantEnabled', String(enabling));
        // VoiceControlService re-initialization (or status update) is handled by useEffect on isVoiceAssistantGloballyEnabled
        speak(`Voice assistant ${enabling ? 'enabled' : 'disabled'}.`);
        if (!enabling && voiceServiceRef.current?.isSpeaking()) {
            speechSynthesis.cancel();
        }
        // Ensure status reflects change immediately
        setVoiceStatus(enabling ? 'idle' : 'disabled');
        break;
      case 'UNKNOWN':
      default:
        speak(`Sorry, I didn't understand the command: ${command.target}. Please try again.`);
        if (isVoiceAssistantGloballyEnabled) setVoiceStatus('idle'); 
        break;
    }
     if (command.action !== 'UNKNOWN' && !voiceServiceRef.current?.isSpeaking() && isVoiceAssistantGloballyEnabled) {
        setTimeout(() => { 
            if (!voiceServiceRef.current?.isSpeaking() && isVoiceAssistantGloballyEnabled) {
                 setVoiceStatus('idle');
            }
        }, 100);
     }

  }, [activeTab, patientInput, singlePrediction, toggleTheme, handlePredict, isVoiceAssistantGloballyEnabled, speak, handleVoiceStatusUpdate]);
  

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (voiceServiceRef.current) {
            // If callbacks change, update them in the existing service instance
            // This assumes VoiceControlService has methods to update callbacks, or is re-instantiated.
            // For simplicity, current setup re-runs the effect if isVoiceAssistantGloballyEnabled changes.
            // If handleVoiceCommand or handleVoiceStatusUpdate changed and needed to be reflected,
            // the service would need to be re-instantiated or have its callbacks updated.
        } else {
            voiceServiceRef.current = new VoiceControlService(handleVoiceCommand, handleVoiceStatusUpdate);
        }
        
        if (!voiceServiceRef.current.getIsSupported()) {
            setIsVoiceAssistantGloballyEnabled(false); // Force disable if not supported
            setVoiceStatus('error');
            setVoiceTranscript("Voice recognition not supported by your browser.");
        } else if (isVoiceAssistantGloballyEnabled) {
            setVoiceStatus(prev => (prev === 'disabled' || prev === 'error') ? 'idle' : prev); // Go to idle if it was disabled
        } else { // Not globally enabled
            setVoiceStatus('disabled');
        }
    }
  }, [isVoiceAssistantGloballyEnabled, handleVoiceCommand, handleVoiceStatusUpdate]);


  const handleVoiceControlClick = () => {
    // This function is called when VoiceControlButton is clicked AND isVoiceAssistantGloballyEnabled is true.
    if (!isVoiceAssistantGloballyEnabled || !voiceServiceRef.current) return;

    if (voiceStatus === 'listening') {
      voiceServiceRef.current.stopListening();
      // Status update will come from service via onend/onerror
    } else if (voiceStatus === 'idle' || voiceStatus === 'error' ){ 
      voiceServiceRef.current.startListening();
    } else if (voiceServiceRef.current.isSpeaking()) {
        speechSynthesis.cancel(); 
        setVoiceStatus('idle'); // Manually set to idle after stopping speech
    }
  };

  const handleToggleVoiceAssistantGlobal = () => {
    const newValue = !isVoiceAssistantGloballyEnabled;
    setIsVoiceAssistantGloballyEnabled(newValue); // This triggers the useEffect to re-evaluate voice state
    localStorage.setItem('voiceAssistantEnabled', String(newValue));
    speak(`Voice assistant ${newValue ? 'enabled' : 'disabled'}.`);
     if (!newValue && voiceServiceRef.current?.isSpeaking()) {
        speechSynthesis.cancel();
    }
    // The useEffect listening to isVoiceAssistantGloballyEnabled will set the voiceStatus correctly.
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const clearAlert = useCallback(() => setAlertMessage(null), []);

  useEffect(() => {
    if (alertMessage) {
      speak(`Alert: ${alertMessage}`);
      const timer = setTimeout(() => {
        clearAlert();
      }, 7000); 
      return () => clearTimeout(timer);
    }
  }, [alertMessage, clearAlert, speak]);
  
  const handleBatchUpload = useCallback((patients: PatientData[]) => {
    setBatchPatients(patients);
    setBatchPredictions(new Map()); 
    setActiveTab('batch'); 
    const message = `${patients.length} patient records loaded for batch processing.`;
    setAlertMessage(message);
  }, []);

  const handlePredictForBatchPatient = useCallback(async (patient: PatientData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = generateMockPredictionOutput(); 
      setBatchPredictions(prev => new Map(prev).set(patient.id, result));
      const message = `Prediction for patient ${patient.id} successful. Risk: ${result.riskPercentage}%.`;
      speak(message);
    } catch (err) {
      console.error(`Prediction error for patient ${patient.id}:`, err);
      const errorMessage = err instanceof Error ? `Error for ${patient.id}: ${err.message}` : `Unknown error for ${patient.id}.`;
      setError(errorMessage);
      speak(`Prediction failed for patient ${patient.id}. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [speak]);

  const handleViewProfile = useCallback((patient: PatientData) => {
    setSelectedPatientForProfile(patient);
    setSelectedPredictionForProfile(batchPredictions.get(patient.id) || null);
  }, [batchPredictions]);

  const handleCloseProfile = useCallback(() => {
    setSelectedPatientForProfile(null);
    setSelectedPredictionForProfile(null);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'single':
        return (
          <>
            <PatientDataForm
              initialData={patientInput}
              onSubmit={handlePredict}
              isLoading={isLoading}
              onDataChange={setPatientInput} 
            />
            {isLoading && <div className="mt-4"><LoadingSpinner /></div>}
            {error && <p className="mt-4 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-50 p-3 rounded">{error}</p>}
            {singlePrediction && !isLoading && <PredictionResultDisplay result={singlePrediction} />}
          </>
        );
      case 'batch':
        return (
          <>
            <BatchUploadForm onUpload={handleBatchUpload} />
            {isLoading && batchPatients.length > 0 && <div className="mt-4"><LoadingSpinner text="Processing batch..." /></div>}
            {error && <p className="mt-4 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-50 p-3 rounded">{error}</p>}
            {batchPatients.length > 0 && (
              <div className="mt-6 bg-white dark:bg-secondary p-4 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-secondary dark:text-primary">Batch Patient List ({batchPatients.length} records)</h3>
                <div className="max-h-96 overflow-y-auto">
                  {batchPatients.map((p) => {
                    const prediction = batchPredictions.get(p.id);
                    return (
                      <div key={p.id} className="mb-3 p-3 bg-slate-50 dark:bg-dark-secondary rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-text-primary">Patient ID: {p.id}</p>
                          <p className="text-sm text-slate-600 dark:text-text-secondary">Age: {p.data.demographics.age}, Gender: {p.data.demographics.gender}</p>
                          {prediction && (
                            <p className={`text-sm font-semibold ${prediction.riskPercentage > 70 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              Risk: {prediction.riskPercentage}%
                            </p>
                          )}
                        </div>
                        <div className="space-x-2">
                           <button
                            onClick={() => handleViewProfile(p)}
                            className="bg-primary hover:bg-yellow-300 text-text-on-primary-bg font-semibold py-1 px-3 rounded text-sm transition-colors duration-150"
                            disabled={!prediction}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handlePredictForBatchPatient(p)}
                            className="bg-accent hover:bg-orange-400 text-white font-semibold py-1 px-3 rounded text-sm transition-colors duration-150"
                            disabled={isLoading}
                          >
                            {prediction ? 'Re-Predict' : 'Predict'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      case 'dashboard':
        return <InsightsDashboard predictions={Array.from(batchPredictions.values())} batchPatients={batchPatients} />;
      default:
        return null;
    }
  };
  
  const TABS: { id: AppTab; label: string }[] = [
    { id: 'single', label: 'Single Prediction' },
    { id: 'batch', label: 'Batch Processing' },
    { id: 'dashboard', label: 'Insights Dashboard' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-bg-main text-slate-900 dark:text-text-primary transition-colors duration-300">
      <Header 
        currentTheme={theme} 
        toggleTheme={toggleTheme}
        voiceStatus={voiceStatus}
        isVoiceAssistantGloballyEnabled={isVoiceAssistantGloballyEnabled}
        onVoiceControlClick={handleVoiceControlClick} // For start/stop listening
        onToggleVoiceAssistantGlobal={handleToggleVoiceAssistantGlobal} // For global enable/disable
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {isVoiceAssistantGloballyEnabled && voiceTranscript && voiceStatus !== 'speaking' && (
             <div className="mb-4 p-2 bg-slate-200 dark:bg-dark-secondary text-sm text-slate-700 dark:text-text-secondary rounded-md shadow text-center italic">
                {voiceStatus === 'listening' ? 'Listening...' : voiceStatus === 'processing' ? `Processing: "${voiceTranscript}"` : `Last command/info: "${voiceTranscript}"`}
             </div>
        )}
        <div className="mb-8">
          <nav className="flex space-x-2 sm:space-x-4 bg-white dark:bg-secondary p-2 rounded-lg shadow-lg">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none py-2 px-4 rounded-md font-medium transition-all duration-200 ease-in-out
                            ${activeTab === tab.id 
                              ? 'bg-primary text-text-on-primary-bg shadow-md' 
                              : 'bg-slate-100 dark:bg-dark-secondary text-slate-700 dark:text-text-secondary hover:bg-slate-200 dark:hover:bg-gray-700 hover:dark:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        {renderTabContent()}
      </main>
      <Footer />
      {selectedPatientForProfile && (
        <PatientProfileModal
          patient={selectedPatientForProfile}
          prediction={selectedPredictionForProfile}
          onClose={handleCloseProfile}
        />
      )}
      {alertMessage && <AlertPopup message={alertMessage} onClose={clearAlert} />}
    </div>
  );
};

export default App;
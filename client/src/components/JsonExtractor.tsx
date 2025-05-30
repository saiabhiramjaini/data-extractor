"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

type ProcessStep = {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
};

type ApiResponse = {
  [key: string]: any;
} | null;

export function JsonExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { name: 'File Upload', status: 'pending' },
    { name: 'PDF to Image Conversion', status: 'pending' },
    { name: 'OCR Processing', status: 'pending' },
    { name: 'LLM Processing', status: 'pending' },
  ]);
  const [result, setResult] = useState<ApiResponse>(null);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setProcessSteps(prev => prev.map(step => 
          step.name === 'File Upload' ? {...step, status: 'completed'} : step
        ));
        setError(null);
        setResult(null);
      }
    },
  });

  const updateProcessStep = (stepName: string, status: 'in-progress' | 'completed' | 'error', message?: string) => {
    setProcessSteps(prev => prev.map(step => 
      step.name === stepName ? {...step, status, message} : step
    ));
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setError(null);

    // Reset all steps except file upload
    setProcessSteps(prev => prev.map(step => 
      step.name === 'File Upload' ? step : {...step, status: 'pending'}
    ));

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Update step 1
      updateProcessStep('PDF to Image Conversion', 'in-progress');

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/extract_json`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // You can track upload progress here if needed
        },
      });

      // Simulate step updates (in a real app, you might have SSE or websocket for real updates)
      updateProcessStep('PDF to Image Conversion', 'completed');
      updateProcessStep('OCR Processing', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProcessStep('OCR Processing', 'completed');
      updateProcessStep('LLM Processing', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProcessStep('LLM Processing', 'completed');

      setResult(response.data);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setProcessSteps(prev => prev.map(step => 
        step.status === 'in-progress' ? {...step, status: 'error'} : step
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessSteps(prev => prev.map(step => ({...step, status: 'pending'})));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Document to JSON Extractor</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <p className="text-lg font-medium">Selected file:</p>
              <p className="text-blue-600 mt-2">{file.name}</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  resetForm();
                }}
                className="mt-4 text-sm text-red-500 hover:text-red-700"
              >
                Change file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium">Drag & drop a PDF or image file here, or click to select</p>
              <p className="text-sm text-gray-500 mt-2">Supports PDF, PNG, JPG, JPEG</p>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                isProcessing 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Extract JSON'}
            </button>
          </div>
        )}
      </div>

      {/* Process Steps */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Processing Steps</h2>
        <div className="space-y-4">
          {processSteps.map((step, index) => (
            <div key={step.name} className="flex items-start">
              <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3 ${
                step.status === 'completed' ? 'bg-green-500' :
                step.status === 'in-progress' ? 'bg-blue-500 animate-pulse' :
                step.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
              }`}>
                {step.status === 'completed' ? (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'error' ? (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <span className="text-xs text-white font-medium">
                    {index + 1}
                  </span>
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'in-progress' ? 'text-blue-700' :
                  step.status === 'error' ? 'text-red-700' : 'text-gray-700'
                }`}>
                  {step.name}
                </p>
                {step.message && (
                  <p className="text-sm text-gray-500 mt-1">{step.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Extracted JSON</h2>
          <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <pre className="text-sm text-gray-800">{JSON.stringify(result, null, 2)}</pre>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result, null, 2));
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
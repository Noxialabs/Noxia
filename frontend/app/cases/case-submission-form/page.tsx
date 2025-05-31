'use client'
import React, { useState } from 'react';
import { AlertCircle, Upload, X, FileText, Shield } from 'lucide-react';
import { CaseService } from '@/service/case/case.service';

const CaseSubmissionForm = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    jurisdiction: '',
    attachments: []
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);

  const jurisdictions = [
    'England and Wales',
    'Scotland', 
    'Northern Ireland',
    'Greater London',
    'Greater Manchester',
    'West Midlands',
    'West Yorkshire',
    'Merseyside',
    'South Yorkshire',
    'Tyne and Wear',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'description') {
      setCharacterCount(value.length);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} type not supported. Allowed: PDF, JPG, PNG, TXT, DOC`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles].slice(0, 5) // Max 5 files
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Case description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Create FormData for API submission
      const submitData = new FormData();
      submitData.append('clientName', formData.clientName);
      submitData.append('description', formData.description);
      
      if (formData.jurisdiction) {
        submitData.append('jurisdiction', formData.jurisdiction);
      }

      // Add file attachments
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          submitData.append('attachments', file);
        });
      }
      
      // Call the CaseService
      const response = await CaseService.submit(submitData);

      if (response.success) {
        setSubmitStatus('success');
        setFormData({
          clientName: '',
          description: '',
          jurisdiction: '',
          attachments: []
        });
        setCharacterCount(0);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit New Case</h1>
        <p className="text-gray-600">
          Report corruption, criminal activity, or legal issues. All submissions are encrypted and securely stored.
        </p>
        <div className="flex items-center mt-4 p-3 bg-blue-50 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-sm text-blue-800">Your case will be analyzed by AI and assigned to the appropriate team</span>
        </div>
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
            <div>
              <h3 className="text-green-800 font-medium">Case Submitted Successfully</h3>
              <p className="text-green-600 text-sm mt-1">Your case has been received and will be processed within 24 hours.</p>
            </div>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Submission Failed</h3>
              <p className="text-red-600 text-sm mt-1">Please try again or contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Client Name */}
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
            Client Name *
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.clientName ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter the client's full name"
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
          )}
        </div>

        {/* Jurisdiction */}
        <div>
          <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-2">
            Jurisdiction (Optional)
          </label>
          <select
            id="jurisdiction"
            name="jurisdiction"
            value={formData.jurisdiction}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select jurisdiction...</option>
            {jurisdictions.map(jurisdiction => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction}
              </option>
            ))}
          </select>
        </div>

        {/* Case Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Case Description *
          </label>
          <div className="relative">
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={8}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Provide a detailed description of the case. Include what happened, when, where, who was involved, and any evidence you have. Minimum 50 characters required."
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {characterCount}/50 minimum
            </div>
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Be as detailed as possible. This information will be used by AI to categorize and prioritize your case.
          </p>
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <label htmlFor="file-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer">
                browse
              </label>
            </p>
            <p className="text-xs text-gray-500">
              Supported: PDF, JPG, PNG, TXT, DOC (Max 10MB each, 5 files total)
            </p>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* File List */}
          {formData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium mb-1">Important Notice:</p>
              <ul className="text-yellow-700 space-y-1">
                <li>• All submissions are confidential and encrypted</li>
                <li>• False reports may result in legal consequences</li>
                <li>• Emergency situations should be reported to local authorities immediately</li>
                <li>• You will receive a case reference number upon submission</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              setFormData({
                clientName: '',
                description: '',
                jurisdiction: '',
                attachments: []
              });
              setCharacterCount(0);
              setErrors({});
            }}
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
              isSubmitting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Case'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseSubmissionForm;
'use client'
import React, { useState } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { CaseService } from '@/service/case/case.service';

const CaseSubmissionForm = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    title: '',
    description: '',
    jurisdiction: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = 'Client name must be at least 2 characters';
    } else if (formData.clientName.trim().length > 255) {
      newErrors.clientName = 'Client name cannot exceed 255 characters';
    }

    if (formData.title.trim() && formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    } else if (formData.title.trim().length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Case description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Case description must be at least 50 characters';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Case description cannot exceed 5000 characters';
    }

    if (formData.jurisdiction.trim().length > 100) {
      newErrors.jurisdiction = 'Jurisdiction cannot exceed 100 characters';
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
      const submitData = {
        clientName: formData.clientName,
        title: formData.title || undefined,
        description: formData.description,
        jurisdiction: formData.jurisdiction || undefined,
      };
      
      // Call the CaseService
      const response = await CaseService.submit(submitData);
      console.log("Response ",response);
      if (response.status==201) {
        setSubmitStatus('success');
        setSubmissionResult(response.data.data);
        setFormData({
          clientName: '',
          title: '',
          description: '',
          jurisdiction: ''
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
      {submitStatus === 'success' && submissionResult && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start mb-4">
            <div className="w-4 h-4 bg-green-400 rounded-full mr-3 mt-1"></div>
            <div>
              <h3 className="text-green-800 font-bold text-lg">Case Submitted Successfully</h3>
              <p className="text-green-600 text-sm mt-1">Your case has been received and analyzed by our AI system.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-1">Case Reference</h4>
                <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {submissionResult.case.caseRef}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-1">Status</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {submissionResult.case.status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-1">Category</h4>
                <p className="text-gray-900 text-sm">{submissionResult.case.issueCategory}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-1">Priority</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  submissionResult.case.priority === 'High' ? 'bg-red-100 text-red-800' :
                  submissionResult.case.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {submissionResult.case.priority}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-1">Escalation Level</h4>
                <p className="text-gray-900 text-sm">{submissionResult.case.escalationLevel}</p>
              </div>
            </div>
            
            {submissionResult.case.suggestedActions && submissionResult.case.suggestedActions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-2">AI Recommended Actions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {JSON.parse(submissionResult.case.suggestedActions[0]).map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Submitted:</strong> {new Date(submissionResult.case.submissionDate).toLocaleString()} | 
                <strong> AI Confidence:</strong> {Math.round(submissionResult.case.aiConfidence * 100)}%
              </p>
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

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter a brief title for the case"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.jurisdiction ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select jurisdiction...</option>
            {jurisdictions.map(jurisdiction => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction}
              </option>
            ))}
          </select>
          {errors.jurisdiction && (
            <p className="mt-1 text-sm text-red-600">{errors.jurisdiction}</p>
          )}
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
                title: '',
                description: '',
                jurisdiction: ''
              });
              setCharacterCount(0);
              setErrors({});
              setSubmitStatus(null);
              setSubmissionResult(null);
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
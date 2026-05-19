import React, { useState } from 'react';
import { generateRoadmapAPI, saveRoadmapAPI } from '../api/roadmapAPI';

const MAX_REGENERATIONS = 5;

const LearningRoadmap = ({ userEmail, onRoadmapSaved }) => {
  const [goal, setGoal] = useState('');
  const [preview, setPreview] = useState(null); // temporary unsaved roadmap
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [regenCount, setRegenCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();

    if (!goal.trim()) {
      setError('Please enter a learning goal first.');
      return;
    }
    if (!userEmail) {
      setError('You must be logged in to generate a roadmap.');
      return;
    }
    if (regenCount >= MAX_REGENERATIONS) {
      setError(`Maximum roadmap regenerations reached (${MAX_REGENERATIONS}). Save or discard the current roadmap.`);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMsg(null);
      const data = await generateRoadmapAPI(userEmail, goal);
      setPreview(data);
      setRegenCount((prev) => prev + 1);
    } catch (err) {
      setError(err.message || 'Error generating roadmap. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    try {
      setIsSaving(true);
      setError(null);
      await saveRoadmapAPI(userEmail, preview.goal, preview.generatedRoadmap);
      setSuccessMsg('Roadmap saved successfully! Check your Learning Hub below.');
      setPreview(null);
      setGoal('');
      setRegenCount(0);
      if (onRoadmapSaved) onRoadmapSaved();
    } catch (err) {
      setError(err.message || 'Failed to save roadmap.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setPreview(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleGenerateAnother = () => {
    if (regenCount >= MAX_REGENERATIONS) {
      setError(`Maximum roadmap regenerations reached (${MAX_REGENERATIONS}). Save or discard the current roadmap.`);
      return;
    }
    handleGenerate();
  };

  const renderPreview = () => {
    if (!preview || !preview.generatedRoadmap) return null;
    const rm = preview.generatedRoadmap;

    return (
      <div className="mt-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>💾 Save Roadmap</>
            )}
          </button>

          <button
            onClick={handleGenerateAnother}
            disabled={isGenerating || regenCount >= MAX_REGENERATIONS}
            className={`px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
              ${regenCount >= MAX_REGENERATIONS
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-xl'
              }`}
          >
            🔄 Generate Another ({MAX_REGENERATIONS - regenCount} left)
          </button>

          <button
            onClick={handleDiscard}
            className="px-5 py-2.5 rounded-xl font-bold bg-white text-red-500 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            🗑️ Discard
          </button>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-yellow-400/20 text-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-400/30">
                Preview — Not Saved Yet
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 relative z-10">
              {rm.goalTitle || preview.goal}
            </h3>
            <p className="text-indigo-100 text-sm sm:text-base max-w-2xl relative z-10 leading-relaxed">
              {rm.description || 'Follow this structured roadmap to achieve your goals!'}
            </p>
          </div>

          {/* Milestones */}
          <div className="p-6 sm:p-8 bg-gray-50/50">
            <div className="space-y-6">
              {rm.milestones && rm.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm border-2 border-indigo-100 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    W {idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded-md">
                        {milestone.week}
                      </span>
                      <h4 className="text-lg font-bold text-gray-800">
                        {milestone.title}
                      </h4>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Topics</h5>
                      <div className="flex flex-wrap gap-2">
                        {milestone.topics && milestone.topics.map((topic, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {milestone.projectSuggestion && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 group-hover:bg-emerald-100 transition-colors duration-300">
                        <div className="flex gap-2 items-start">
                          <span className="text-emerald-500 mt-0.5">🚀</span>
                          <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Suggested Project</p>
                            <p className="text-sm text-emerald-700 mt-0.5 font-medium">{milestone.projectSuggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 lg:p-8 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">🧭</span> AI Learning Roadmap Generator
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Let AI create a customized, step-by-step learning path for your career goals.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium mt-0.5">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
          <span className="text-xl">✅</span>
          <p className="text-sm font-medium mt-0.5">{successMsg}</p>
        </div>
      )}

      {/* Generate Form — only show when no preview is active */}
      {!preview && (
        <form onSubmit={handleGenerate} className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 h-full"></div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="goal" className="sr-only">What do you want to learn?</label>
              <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Become a MERN Stack Developer, Learn UI/UX Design..."
                className="w-full h-12 px-4 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-shadow hover:shadow-md"
                disabled={isGenerating}
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating || !goal.trim() || !userEmail}
              className={`h-12 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap
                ${isGenerating
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'
                }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating AI Roadmap...
                </>
              ) : (
                <>
                  <span className="text-lg">✨</span> Generate Roadmap
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading state during regeneration */}
      {isGenerating && preview && (
        <div className="flex flex-col items-center justify-center py-12 mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Generating a new variation...</p>
        </div>
      )}

      {/* Preview area */}
      {!isGenerating && preview && renderPreview()}

      {/* Empty state — only show when no preview and not generating */}
      {!preview && !isGenerating && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300 mt-6">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No Roadmap Generated</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Enter a learning goal above and let AI map out your learning journey!
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningRoadmap;

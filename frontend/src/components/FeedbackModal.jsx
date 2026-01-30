import React, { useState } from 'react';
import { X, Lock, CheckCircle, ShieldCheck, Star, Send } from 'lucide-react';

// Helper sub-component for stars
const StarRating = ({ value, onChange, label, subLabel }) => {
  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <label className="text-base font-bold text-slate-800 block">{label}</label>
          <span className="text-xs text-slate-500">{subLabel}</span>
        </div>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold">
          {value}/5
        </div>
      </div>
      <div className="flex space-x-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all duration-200 transform hover:scale-110 p-1 rounded-md ${star <= value ? 'text-yellow-400 drop-shadow-sm' : 'text-slate-200 hover:text-slate-300'}`}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function FeedbackModal({ selectedCourse, onClose, onSubmit, isMining, miningStep }) {
  const [ratings, setRatings] = useState({ teaching: 0, comms: 0, fairness: 0, engage: 0 });
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Store feedback in temp variable before sending to backend
    const feedbackData = {
      ratings,
      comment,
      submittedAt: new Date().toISOString()
    };
    onSubmit(feedbackData.ratings, feedbackData.comment);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
           <div>
             <h3 className="text-xl font-extrabold text-slate-800">Submit Feedback</h3>
             <p className="text-slate-500 text-sm">{selectedCourse.courseName || selectedCourse.name}</p>
             <p className="text-slate-400 text-xs mt-1">Teacher: {selectedCourse.teacherName || selectedCourse.faculty}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors" disabled={isMining}>
             <X className="w-6 h-6 text-slate-400" />
           </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {isMining ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-8">
               <div className="relative">
                 <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-indigo-600 animate-pulse" />
                 </div>
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold text-slate-800">Mining Block...</h3>
                 <p className="text-slate-500">Please wait while the smart contract validates your feedback.</p>
               </div>
               
               {/* Steps Animation */}
               <div className="w-full max-w-xs space-y-3">
                  <div className={`flex items-center space-x-3 transition-opacity ${miningStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Hashing Student ID (SHA-256)</span>
                  </div>
                  <div className={`flex items-center space-x-3 transition-opacity ${miningStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Encrypting Comments (AES)</span>
                  </div>
                  <div className={`flex items-center space-x-3 transition-opacity ${miningStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Updating Distributed Ledger</span>
                  </div>
               </div>
             </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start space-x-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Anonymity Guaranteed</h4>
                  <p className="text-xs text-blue-700 mt-1">Your ID will be hashed before leaving this device. The faculty will never know who submitted this feedback.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StarRating label="Teaching" subLabel="Subject knowledge & clarity" value={ratings.teaching} onChange={(v) => setRatings({...ratings, teaching: v})} />
                <StarRating label="Communication" subLabel="Delivery & language" value={ratings.comms} onChange={(v) => setRatings({...ratings, comms: v})} />
                <StarRating label="Fairness" subLabel="Grading & behavior" value={ratings.fairness} onChange={(v) => setRatings({...ratings, fairness: v})} />
                <StarRating label="Engagement" subLabel="Classroom interaction" value={ratings.engage} onChange={(v) => setRatings({...ratings, engage: v})} />
              </div>

              <div className="mt-6">
                <label className="text-sm font-bold text-slate-800 mb-2 block">Additional Comments (Encrypted)</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" 
                  rows="3" 
                  placeholder="Write your honest review here..."
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 flex items-center space-x-2 transition-all transform active:scale-95">
                  <Send className="w-4 h-4" />
                  <span>Sign & Submit</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
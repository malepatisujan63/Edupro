import React from 'react';
import { Megaphone, Calendar } from 'lucide-react';

export const CampusFeed: React.FC = () => {

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 pb-32">
      
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <span>Campus Feed & Placement Opportunities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Hackathons, Workshops & Career Drive
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Stay updated with real-time campus notifications broadcasted via our priority <b>FIFO TaskQueue</b>.
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="p-12 rounded-3xl border border-white/5 bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
          <Calendar className="w-8 h-8 text-indigo-400/50" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">No upcoming events</h3>
          <p className="text-sm text-slate-400">Check back later for new hackathons, drives, and workshops.</p>
        </div>
      </div>

    </div>
  );
};

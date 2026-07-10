import React from 'react';
import { Calendar, Briefcase, Trophy, Megaphone, MapPin, ExternalLink } from 'lucide-react';

export const CampusFeed: React.FC = () => {
  const events = [
    {
      id: 'evt_1',
      title: 'National Hackathon: AI for Education 2026',
      type: 'Hackathon',
      organizer: 'IIT Bombay & Google DeepMind',
      date: 'Aug 15 - 17, 2026',
      location: 'Main Auditorium / Hybrid',
      prizePool: '₹5,00,000 + Google Cloud Credits',
      tags: ['Hackathon', 'AI', 'Cloud', 'Open to All'],
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'evt_2',
      title: 'Software Engineering Intern (Summer 2027) - Campus Drive',
      type: 'Internship Opportunity',
      organizer: 'Microsoft India Engineering Center',
      date: 'Application Deadline: July 30, 2026',
      location: 'Remote / Bengaluru Office',
      prizePool: 'Stipend: ₹1,25,000 / month',
      tags: ['Internship', 'Placement', 'DSA Round', 'System Design'],
      icon: <Briefcase className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'evt_3',
      title: 'Workshop: Master Graph BFS/DFS & Union-Find for Competitive Coding',
      type: 'Technical Workshop',
      organizer: 'CodeChef & ACM Campus Chapter',
      date: 'July 20, 2026 • 6:00 PM IST',
      location: 'Lecture Hall 4 & Zoom Live',
      prizePool: 'Free Certificate & Practice Sheet',
      tags: ['Workshop', 'Graphs', 'BFS/DFS', 'CP'],
      icon: <Calendar className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'evt_4',
      title: 'Club Announcement: Annual Web Development Bootcamp Starts This Week',
      type: 'Club Update',
      organizer: 'Google Developer Student Club (GDSC)',
      date: 'Starting July 14, 2026',
      location: 'Lab 201',
      prizePool: 'Hands-on React & Spring Boot Projects',
      tags: ['GDSC', 'Web Dev', 'Bootcamp'],
      icon: <Megaphone className="w-5 h-5 text-pink-400" />,
    },
  ];

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

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 transition-all shadow-xl space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                    {evt.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                      {evt.type}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  {evt.prizePool}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                {evt.title}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{evt.organizer}</p>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{evt.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{evt.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {evt.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => alert(`Registered for ${evt.title}! Added to your active calendar.`)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Register / Apply Now ($O(1)$)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

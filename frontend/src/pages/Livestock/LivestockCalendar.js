import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Filter,
  Syringe, Heart, Baby, AlertTriangle, Package, Stethoscope,
  ArrowLeft,
} from 'lucide-react';
import api from '../../api/axios';

const EVENT_COLORS = {
  vaccination:  { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   icon: Syringe },
  health_check: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: Stethoscope },
  birth:        { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-200',    icon: Baby },
  due_date:     { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-200',    icon: Baby },
  treatment:    { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-200',  icon: Stethoscope },
  reminder:     { bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-200',  icon: AlertTriangle },
  inventory:    { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-200',  icon: Package },
  other:        { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',   icon: Calendar },
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const SAMPLE_EVENTS = [
  { _id: '1', date: new Date(), type: 'vaccination', title: 'Boran #12 — FMD vaccine due', animalName: 'Boran #12' },
  { _id: '2', date: new Date(Date.now() + 86400000 * 2), type: 'due_date', title: 'Heifer #7 — expected birth', animalName: 'Heifer #7' },
  { _id: '3', date: new Date(Date.now() + 86400000 * 5), type: 'health_check', title: 'Quarterly vet check — all cattle', animalName: 'All cattle' },
  { _id: '4', date: new Date(Date.now() + 86400000 * 7), type: 'reminder', title: 'Reorder dairy meal (low stock)', animalName: '' },
  { _id: '5', date: new Date(Date.now() + 86400000 * 10), type: 'treatment', title: 'Bull #3 — deworming', animalName: 'Bull #3' },
  { _id: '6', date: new Date(Date.now() - 86400000 * 3), type: 'birth', title: 'Doe #9 — gave birth (twin kids)', animalName: 'Doe #9' },
];

function CalendarDay({ day, month, year, events, today, selected, onSelect }) {
  const date = new Date(year, month, day);
  const isToday = isSameDay(date, today);
  const isSelected = selected && isSameDay(date, selected);
  const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));

  return (
    <button
      onClick={() => onSelect(date)}
      className={`relative min-h-[72px] w-full text-left p-1.5 border transition-colors focus:outline-none ${
        isSelected
          ? 'bg-emerald-600 border-emerald-700'
          : isToday
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-white border-slate-100 hover:bg-slate-50'
      }`}
    >
      <span className={`text-xs font-bold block mb-1 ${
        isSelected ? 'text-white' : isToday ? 'text-emerald-700' : 'text-slate-700'
      }`}>
        {day}
      </span>
      <div className="space-y-0.5">
        {dayEvents.slice(0, 2).map(ev => {
          const style = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
          return (
            <div key={ev._id} className={`truncate text-[10px] font-semibold px-1 py-0.5 rounded-sm ${style.bg} ${style.text}`}>
              {ev.title}
            </div>
          );
        })}
        {dayEvents.length > 2 && (
          <div className="text-[10px] text-slate-500 font-semibold px-1">+{dayEvents.length - 2} more</div>
        )}
      </div>
    </button>
  );
}

function LivestockCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterType, setFilterType] = useState('all');

  const { data: reminders } = useQuery('livestock-reminders', async () => {
    const res = await api.get('/livestock/reminders');
    return res.data.data;
  }, { retry: false });

  const { data: reproUpcoming } = useQuery('livestock-upcoming-births', async () => {
    const res = await api.get('/livestock/reproduction/upcoming-births');
    return res.data.data;
  }, { retry: false });

  const apiEvents = [
    ...(reminders?.map(r => ({
      _id: r._id,
      date: new Date(r.reminder?.dueDate || r.date || Date.now()),
      type: r.type || 'reminder',
      title: r.title || r.notes || r.reminder?.notes || 'Reminder',
      animalName: r.animal?.tagId || r.animal?.name || '',
    })) || []),
    ...(reproUpcoming?.map(r => ({
      _id: `birth-${r._id}`,
      date: new Date(r.pregnancy?.expectedDueDate || r.expectedDueDate || Date.now()),
      type: 'due_date',
      title: `${r.animal?.tagId || r.animal?.name || 'Animal'} — expected birth`,
      animalName: r.animal?.tagId || r.animal?.name || '',
    })) || []),
  ];

  const events = apiEvents.length > 0 ? apiEvents : SAMPLE_EVENTS;

  const filtered = filterType === 'all' ? events : events.filter(e => e.type === filterType);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectedDayEvents = filtered.filter(e => isSameDay(new Date(e.date), selectedDate));

  const upcomingEvents = filtered
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/livestock" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={22} className="text-emerald-600" /> Livestock Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Events, reminders & upcoming births across your herd</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500"
          >
            <option value="all">All events</option>
            <option value="vaccination">Vaccinations</option>
            <option value="health_check">Health checks</option>
            <option value="due_date">Due dates</option>
            <option value="birth">Births</option>
            <option value="treatment">Treatments</option>
            <option value="reminder">Reminders</option>
            <option value="inventory">Inventory</option>
          </select>
          <Link
            to="/livestock/reproduction"
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={15} /> Add Event
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Calendar grid */}
        <div className="bg-white border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <button onClick={prevMonth} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-bold text-slate-900 text-lg">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50 min-h-[72px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => (
              <CalendarDay
                key={i + 1}
                day={i + 1}
                month={viewMonth}
                year={viewYear}
                events={filtered}
                today={today}
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Selected day events */}
          <div className="bg-white border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-emerald-600" />
              {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map(ev => {
                  const style = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                  const Icon = style.icon;
                  return (
                    <div key={ev._id} className={`flex items-start gap-3 p-3 border ${style.border} ${style.bg}`}>
                      <Icon size={14} className={`mt-0.5 flex-shrink-0 ${style.text}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${style.text}`}>{ev.title}</p>
                        {ev.animalName && <p className="text-xs text-slate-500 mt-0.5">{ev.animalName}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No events on this day</p>
            )}
          </div>

          {/* Upcoming events */}
          <div className="bg-white border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Upcoming Events</h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map(ev => {
                  const style = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                  const Icon = style.icon;
                  const evDate = new Date(ev.date);
                  const diffDays = Math.ceil((evDate - today) / 86400000);
                  return (
                    <div key={ev._id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                      <div className={`flex-shrink-0 flex h-7 w-7 items-center justify-center ${style.bg}`}>
                        <Icon size={13} className={style.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{ev.title}</p>
                        <p className="text-xs text-slate-500">
                          {evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' · '}
                          <span className={diffDays <= 3 ? 'text-red-600 font-semibold' : 'text-slate-400'}>
                            {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No upcoming events</p>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Legend</h3>
            <div className="space-y-1.5">
              {Object.entries(EVENT_COLORS).map(([type, style]) => {
                const Icon = style.icon;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 items-center justify-center ${style.bg}`}>
                      <Icon size={11} className={style.text} />
                    </div>
                    <span className="text-xs text-slate-600 capitalize">{type.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            <Link to="/livestock/reproduction" className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors">
              <Heart size={13} /> Reproduction
            </Link>
            <Link to="/livestock/inventory" className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors">
              <Package size={13} /> Inventory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LivestockCalendar;

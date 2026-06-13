import UserProfile from '../models/UserProfile.js';
import Session from '../models/Session.js';

/**
 * Helper to add days to a date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get user availability by email (generates actual available slots for the next 14 days)
 */
export const getAvailability = async (email) => {
  const user = await UserProfile.findOne({ email }).lean();
  if (!user) return [];

  const recurring = user.availability || [];
  const custom = user.customAvailability || [];

  // Generate the next 14 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let allPossibleSlots = [];

  for (let i = 0; i < 14; i++) {
    const targetDate = addDays(today, i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayName = daysMap[targetDate.getDay()];

    // Add recurring slots for this day
    const dayAvail = recurring.find(a => a.day === dayName);
    if (dayAvail && dayAvail.slots) {
      dayAvail.slots.forEach(slot => {
        allPossibleSlots.push({
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: 'recurring'
        });
      });
    }

    // Add custom slots for this date
    const customAvail = custom.find(a => a.date === dateStr);
    if (customAvail && customAvail.slots) {
      customAvail.slots.forEach(slot => {
        allPossibleSlots.push({
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: 'custom'
        });
      });
    }
  }

  // Fetch all booked sessions for this user (Scheduled or Pending) in the next 14 days
  const endDateStr = addDays(today, 14).toISOString().split('T')[0];
  const bookedSessions = await Session.find({
    participants: email,
    status: { $in: ['Scheduled', 'Rescheduled', 'Pending'] },
    date: { $gte: today.toISOString().split('T')[0], $lte: endDateStr }
  }).lean();

  // Filter out slots that conflict with booked sessions
  // A simple overlap check: max(start1, start2) < min(end1, end2)
  const availableSlots = allPossibleSlots.filter(slot => {
    const slotConflictingSession = bookedSessions.find(session => {
      if (session.date !== slot.date) return false;
      const s1 = slot.startTime;
      const e1 = slot.endTime;
      const s2 = session.startTime || session.time;
      const e2 = session.endTime;
      
      // If either session start or end is missing, fallback to true if date matches (defensive)
      if (!s2 || !e2) return true; 

      return (s1 < e2 && s2 < e1);
    });
    return !slotConflictingSession;
  });

  // Sort chronologically
  availableSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return availableSlots;
};

/**
 * Save user availability (recurring and custom)
 */
export const saveAvailability = async (email, availability, customAvailability = []) => {
  const updateData = { availability };
  if (customAvailability) {
    updateData.customAvailability = customAvailability;
  }
  
  const user = await UserProfile.findOneAndUpdate(
    { email },
    updateData,
    { returnDocument: 'after' }
  ).lean();

  if (!user) throw new Error('User not found');
  return { availability: user.availability, customAvailability: user.customAvailability };
};

/**
 * Check if a given date and time matches user's availability
 * @param {Array} availableSlots Flat array returned by getAvailability
 * @param {String} dateString YYYY-MM-DD
 * @param {String} startTime HH:mm
 * @param {String} endTime HH:mm
 */
export const checkMatchesAvailability = (availableSlots, dateString, startTime, endTime) => {
  if (!availableSlots || availableSlots.length === 0) return false;

  // Check if requested time falls within ANY of the available slots for that date
  for (const slot of availableSlots) {
    if (slot.date === dateString) {
      if (startTime >= slot.startTime && endTime <= slot.endTime) {
        return true;
      }
    }
  }

  return false;
};

/** Working-day timetable in minutes since midnight (spec §2). */
export const SCHEDULE = {
  arrive: [462, 490] as const, // 07:42–08:10
  lateArrive: [498, 515] as const, // one person per day
  standup: [510, 525] as const, // 08:30–08:45
  lunchStart: [720, 726] as const, // 12:00–12:06
  lunchLen: [26, 38] as const,
  napEnd: [806, 810] as const, // back to desk by 13:30
  sprintMeeting: [900, 945] as const, // 15:00–15:45
  sprintMeetingSize: 4,
  wcMorning: [560, 690] as const,
  wcAfternoon: [850, 1010] as const,
  wcLen: 5,
  leave: [1050, 1075] as const, // 17:30–17:55
  overtime: [1140, 1230] as const, // 19:00–20:30
  overtimeCount: 2,
  sofaNappers: 3,
  eventsFrom: 480,
  eventsUntil: 1260,
  eventEveryMin: 4,
}

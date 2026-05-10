/**
 * Weight document shape (stored in `weight` collection):
 * {
 *   _id:       ObjectId,
 *   userId:    string,
 *   value:     number  (kg),
 *   date:      string  (YYYY-MM-DD),
 *   loggedAt:  Date
 * }
 *
 * Index: { userId, loggedAt: -1 }
 * One entry per date per user (upsert on duplicate date).
 */

export function formatWeightEntry(entry) {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun",
                      "Jul","Aug","Sep","Oct","Nov","Dec"];
  const [year, month, day] = entry.date.split("-");
  return {
    ...entry,
    displayDate: `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
  };
}

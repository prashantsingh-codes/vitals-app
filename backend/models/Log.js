/**
 * Log document shape (stored in `logs` collection):
 * {
 *   _id:        ObjectId,
 *   userId:     string,
 *   date:       string  (YYYY-MM-DD),
 *   items:      object  { [foodId]: number },
 *   wholeEggs:  number,
 *   eggWhites:  number,
 *   water:      number,
 *   steps:      string,
 *   updatedAt:  Date
 * }
 *
 * Unique index: { userId, date }
 */

export function emptyLog(userId, date) {
  return {
    userId,
    date,
    items:     {},
    wholeEggs: 0,
    eggWhites: 0,
    water:     0,
    steps:     "",
  };
}

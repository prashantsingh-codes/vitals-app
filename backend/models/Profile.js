/**
 * Profile document shape (stored in `profiles` collection):
 * {
 *   _id:                  ObjectId,
 *   userId:               string,
 *   goal:                 "lose" | "gain",
 *   profile:              { age, gender, weight, height, activity, training, targetWeight, steps },
 *   targets:              { cal, pro, fat },
 *   presetFoods:          array | null,
 *   permDeletedPromoted:  string[],
 *   everPromoted:         string[],
 *   permDeletedPresets:   string[],
 *   updatedAt:            Date
 * }
 */

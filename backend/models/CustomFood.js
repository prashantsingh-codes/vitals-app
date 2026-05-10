/**
 * CustomFood document shape (stored in `customFoods` collection):
 * {
 *   _id:       ObjectId,
 *   userId:    string,
 *   name:      string,
 *   cal:       number,
 *   pro:       number,
 *   fat:       number,
 *   checked:   boolean,
 *   createdAt: Date
 * }
 *
 * Index: { userId }
 */

export function normalizeCustomFood(food) {
  return {
    ...food,
    id:  String(food._id),
    _id: String(food._id),
  };
}

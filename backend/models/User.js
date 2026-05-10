import { ObjectId } from "mongodb";

/**
 * User document shape (stored in `users` collection):
 * {
 *   _id:       ObjectId,
 *   name:      string,
 *   email:     string (unique),
 *   password:  string (bcrypt hash),
 *   createdAt: Date
 * }
 */

export function userPublic(user) {
  return {
    id:    user._id,
    name:  user.name,
    email: user.email,
  };
}

import {onCall, HttpsError} from "firebase-functions/v2/https";

export const deleteAccount = onCall(
  {
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required",
      );
    }

    const uid = request.auth.uid;

    try {
      // Production implementation intentionally omitted
      // from the public showcase.
      //
      // The production function:
      // 1. Removes family relationships and pending invites.
      // 2. Removes registered devices and notifications.
      // 3. Removes public user records.
      // 4. Removes the user's Firestore document and subcollections.
      // 5. Deletes the Firebase Authentication account.

      return {success: true};
    } catch (error) {
      console.error("[deleteAccount] Failed:", uid, error);

      throw new HttpsError(
        "internal",
        "Account deletion failed",
      );
    }
  },
);

import {getFirestore, collection, collectionGroup, doc} from '@react-native-firebase/firestore'

import {APP_ID} from '@constant/config'

const db = getFirestore()

// ======================================================
// PUBLIC USER DIRECTORY
// ======================================================

export const usersPublicCollectionRef = () => collection(db, 'users_public')

export const userPublicDocRef = (userServerId: string) =>
doc(usersPublicCollectionRef(), userServerId)


// ======================================================
// APPLICATION COLLECTIONS
// ======================================================

export const deviceCollectionRef = () =>
  collection(db, 'artifacts', String(APP_ID), 'devices')

export const notificationCollectionRef = () =>
  collection(db, 'artifacts', String(APP_ID), 'notifications')

export const familyMemberCollectionRef = () =>
  collection(db, 'artifacts', String(APP_ID), 'family_members')

export const familyInviteCollectionRef = () =>
  collection(db, 'artifacts', String(APP_ID), 'family_invites')


// ======================================================
// USER DOCUMENT
// ======================================================

export const userDocRef = (userServerId: string) =>
  doc(db, 'artifacts', String(APP_ID), 'users', userServerId)


// ======================================================
// USER COLLECTIONS
// ======================================================

export const settingCollectionRef = (userServerId: string) =>
  collection(userDocRef(userServerId), 'setting')

export const reminderCollectionRef = (userServerId: string) =>
  collection(userDocRef(userServerId), 'reminders')

export const reminderOccurrenceCollectionRef = (userServerId: string) =>
  collection(userDocRef(userServerId), 'reminders_occurrences')

export const reminderEventCollectionRef = (userServerId: string) =>
  collection(userDocRef(userServerId), 'reminders_events')

export const activityLogCollectionRef = (userServerId: string) =>
  collection(userDocRef(userServerId), 'activity_logs')


// ======================================================
// APPLICATION DOCUMENTS
// ======================================================

export const deviceDocRef = (serverId: string) => doc(deviceCollectionRef(), serverId)

export const notificationDocRef = (serverId: string) =>
doc(notificationCollectionRef(), serverId)

export const familyInviteDocRef = (serverId: string) =>
  doc(familyInviteCollectionRef(), serverId)

export const familyMemberDocRef = (serverId: string) =>
  doc(familyMemberCollectionRef(), serverId)


// ======================================================
// USER DOCUMENTS
// ======================================================

export const settingDocRef = (userServerId: string) =>
  doc(settingCollectionRef(userServerId), 'default')

export const reminderDocRef = (userServerId: string, reminderServerId: string) =>
  doc(reminderCollectionRef(userServerId), reminderServerId)

export const reminderOccurrenceDocRef = (userServerId: string, occurrenceServerId: string) =>
  doc(reminderOccurrenceCollectionRef(userServerId), occurrenceServerId)

export const reminderEventDocRef = (userServerId: string, eventServerId: string) =>
  doc(reminderEventCollectionRef(userServerId), eventServerId)

export const activityLogDocRef = (userServerId: string, activityServerId: string) =>
  doc(activityLogCollectionRef(userServerId), activityServerId)


// ======================================================
// ACTIVITY LOG SUB COLLECTION
// ======================================================

export const activityLogMetaCollectionRef = (userServerId: string, activityLogServerId: string) =>
  collection(activityLogDocRef(userServerId, activityLogServerId), 'logs_meta')

export const activityLogMetaDocRef = (userServerId: string, activityLogServerId: string, activityLogMetaServerId: string) =>
  doc(activityLogMetaCollectionRef(userServerId, activityLogServerId),
    activityLogMetaServerId)


// ======================================================
// COLLECTION GROUP QUERIES
// ======================================================

export const reminderOccurrencesCollectionGroupRef = () =>
  collectionGroup(db, 'reminders_occurrences')

export const reminderEventsCollectionGroupRef = () =>
  collectionGroup(db, 'reminders_events')

export const familyAccessCollectionRef = () =>
  collection(db, 'artifacts', String(APP_ID), 'family_access')

export const familyAccessDocRef = (ownerServerId: string, memberServerId: string) =>
  doc(familyAccessCollectionRef(), `${ownerServerId}_${memberServerId}`)
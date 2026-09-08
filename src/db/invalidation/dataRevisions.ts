export type DataDomain =
    | 'rems'
    | 'rem_ocrrncs'
    | 'rem_events'
    | 'activity_logs'
    | 'family_members'
    | 'family_invites'
    | 'notifications'
    | 'settings'
    | 'medicines'

/**
 * Domain-level change tracking and subscription mechanism.
 *
 * Used by the application to efficiently notify interested
 * screens/hooks when locally stored data changes.
 *
 * The internal revision tracking, batching, and listener
 * implementation is omitted from the public showcase.
 */

export const bumpTable = (domain: DataDomain) => {
    // Internal invalidation implementation omitted.
}

export const getRevision = (domain: DataDomain) => {
    // Internal revision lookup omitted.
    return 0
}

export const subscribeDataChanges = (
    domain: DataDomain,
    listener: () => void,
) => {
    // Internal subscription implementation omitted.
    return () => {}
}

export const subscribeTodayReminderChanges = (
    listener: () => void
) => {
    // Internal reminder-domain subscription omitted.
    return () => {}
}
import { RemEvent } from '@type/reminder'

/**
 * Internal event notification mechanism used to propagate
 * reminder-event changes across interested UI components.
 *
 * Implementation omitted from public showcase.
 */

export const subscribeRemEventChanges = (
    listener: (event: RemEvent) => void
) => {
    // Internal event subscription implementation omitted.
    return () => {}
}

export const notifyRemEventChange = (event: RemEvent) => {
    // Internal event dispatch implementation omitted.
}
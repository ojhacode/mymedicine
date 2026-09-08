import { DailyProgressData, ProgressChartData, ProgressOccurrence, ProgressSummary } from "@type/screen/progress"
import { bsDate } from "@utils/date"
import { toNepaliDigits } from "@utils/helper"
import dayjs from "dayjs"
import { getTimeBucket, isMissedOccurrence } from "./screen1st_remindersummary"

export const buildSummary = (rows: ProgressOccurrence[]): ProgressSummary => {
    let onTime = 0
    let lateTime = 0
    let incomplete = 0
    let missed = 0
    const now = Date.now()
    const ON_TIME_THRESHOLD = 5 * 60_000
    rows.forEach(row => {
        const { status, scheduledAt } = row.log
        switch (status) {
            case 1: {
                const delay = Math.abs(row.createdAt - scheduledAt)
                if (delay <= ON_TIME_THRESHOLD) {
                    onTime++
                } else {
                    lateTime++
                }
                break
            }
            case 5:
                incomplete++
                break
            case 3:
                incomplete++
                break
            default:
                if (scheduledAt <= now - 60_000) missed++
                break
        }
    })
    const total = onTime + lateTime + incomplete + missed
    const taken = onTime + lateTime
    return { total, onTime, lateTime, incomplete, missed, adherence: total ? Math.round((taken / total) * 100) : 0}
}

export const buildDailyProgressData = (progressData: ProgressOccurrence[], startDate: Date, endDate: Date, locale: string) => {
    const result = []
    // Keep original date for AD ↔ BS display
    let displayDate = dayjs(startDate)
    const rangeEnd = dayjs(endDate)

    while (displayDate.isBefore(rangeEnd, 'day') || displayDate.isSame(rangeEnd, 'day')) {
        // Boundary ONLY for filtering
        const queryStart = displayDate.startOf('day')
        const queryEnd = displayDate.endOf('day')
        const rows = progressData.filter(item =>
            item.createdAt >= queryStart.valueOf() && item.createdAt <= queryEnd.valueOf()
        )
        const summary = buildSummary(rows)
        // IMPORTANT: original displayDate
        const bs = bsDate(displayDate.toDate())
        result.push({
            day: locale === 'ne' ? bs?.weekday ?? '' : displayDate.format('ddd'),
            date: locale === 'ne' && bs ? `${toNepaliDigits(bs.day)} ${bs.monthName}` : displayDate.format('D MMM'),
            total: summary.total,
            green: summary.onTime + summary.lateTime,
            blue: summary.incomplete,
            red: summary.missed,
            adherence: summary.adherence,
        })
        displayDate = displayDate.add(1, 'day')
    }
    return result
}

export const buildWeeklyProgressData = (progressData: ProgressOccurrence[], startDate: Date, endDate: Date, locale: string) => {
    const result = []
    let periodStart = dayjs(startDate)
    const rangeEnd = dayjs(endDate)
    while (periodStart.isBefore(rangeEnd, 'day') || periodStart.isSame(rangeEnd, 'day')) {
        const periodEnd = periodStart.add(6, 'day')
        const actualEnd = periodEnd.isAfter(rangeEnd, 'day') ? rangeEnd : periodEnd
        const startKey = periodStart.format('YYYY-MM-DD')
        const endKey = actualEnd.format('YYYY-MM-DD')
        const rows = progressData.filter(item => {
            const key = dayjs(item.createdAt).format('YYYY-MM-DD')
            return key >= startKey && key <= endKey
        })
        const summary = buildSummary(rows)
        const bsStart = bsDate(periodStart.toDate())
        const bsEnd = bsDate(actualEnd.toDate())
        result.push({
            day: locale === 'ne' ? bsStart?.monthName ?? '' : periodStart.format('MMM'),
            date: locale === 'ne' && bsStart && bsEnd
                ? `${toNepaliDigits(bsStart.day)}–${toNepaliDigits(bsEnd.day)}`
                : `${periodStart.format('D')}–${actualEnd.format('D MMM')}`,
            total: summary.total,
            green: summary.onTime + summary.lateTime,
            blue: summary.incomplete,
            red: summary.missed,
            adherence: summary.adherence,
        })
        periodStart = periodStart.add(7, 'day')
    }
    return result
}

export const buildMonthlyProgressData = (progressData: ProgressOccurrence[], startDate: Date, endDate: Date, locale: string) => {
    const result = []
    let periodStart = dayjs(startDate)
    const rangeEnd = dayjs(endDate)
    while (periodStart.isBefore(rangeEnd, 'day') || periodStart.isSame(rangeEnd, 'day')) {
        const periodEnd = periodStart.add(1, 'month').subtract(1, 'day')
        const actualEnd = periodEnd.isAfter(rangeEnd, 'day') ? rangeEnd : periodEnd
        const startKey = periodStart.format('YYYY-MM-DD')
        const endKey = actualEnd.format('YYYY-MM-DD')
        const rows = progressData.filter(item => {
            const key = dayjs(item.createdAt).format('YYYY-MM-DD')
            return key >= startKey && key <= endKey
        })
        const summary = buildSummary(rows)
        const bsStart = bsDate(periodStart.toDate())
        const bsEnd = bsDate(actualEnd.toDate())

        result.push({
            day: locale === 'ne' ? bsStart?.monthName ?? '' : periodStart.format('MMM'),
            date: locale === 'ne' && bsStart && bsEnd
                ? `${toNepaliDigits(bsStart.day)} ${bsStart.monthName} – ${toNepaliDigits(bsEnd.day)} ${bsEnd.monthName}`
                : `${periodStart.format('D MMM')} – ${actualEnd.format('D MMM')}`,
            total: summary.total,
            green: summary.onTime + summary.lateTime,
            blue: summary.incomplete,
            red: summary.missed,
            adherence: summary.adherence,
        })
        periodStart = periodStart.add(1, 'month')
    }
    return result
}

export const buildHalfYearlyProgressData = (progressData: ProgressOccurrence[], startDate: Date, endDate: Date, locale: string) => {
    const result = []
    let periodStart = dayjs(startDate)
    const rangeEnd = dayjs(endDate)
    while (periodStart.isBefore(rangeEnd, 'day') || periodStart.isSame(rangeEnd, 'day')) {
        const periodEnd = periodStart.add(6, 'month').subtract(1, 'day')
        const actualEnd = periodEnd.isAfter(rangeEnd, 'day') ? rangeEnd : periodEnd
        const startKey = periodStart.format('YYYY-MM-DD')
        const endKey = actualEnd.format('YYYY-MM-DD')
        const rows = progressData.filter(item => {
            const key = dayjs(item.createdAt).format('YYYY-MM-DD')
            return key >= startKey && key <= endKey
        })
        const summary = buildSummary(rows)
        const bsStart = bsDate(periodStart.toDate())
        const bsEnd = bsDate(actualEnd.toDate())
        result.push({
            day: locale === 'ne' ? bsStart?.monthName ?? '' : periodStart.format('MMM'),
            date: locale === 'ne' && bsStart && bsEnd
                ? `${toNepaliDigits(bsStart.day)} ${bsStart.monthName} – ${toNepaliDigits(bsEnd.day)} ${bsEnd.monthName}`
                : `${periodStart.format('D MMM')} – ${actualEnd.format('D MMM')}`,
            total: summary.total,
            green: summary.onTime + summary.lateTime,
            blue: summary.incomplete,
            red: summary.missed,
            adherence: summary.adherence,
        })
        periodStart = periodStart.add(6, 'month')
    }
    return result
}

export const buildBestPeriod = (chartData: ProgressChartData[]) => {
    const validPeriods = chartData.filter(item => item.total > 0 && item.green > 0)
    if (!validPeriods.length) return null
    return validPeriods.reduce(
        (best, current) => current.adherence > best.adherence ? current : best
    )
}

export const buildMostMissedTime = (progressData: ProgressOccurrence[]) => {
    const counts = new Map<string, number>()
    const now = Date.now()
    for (const row of progressData) {
        const { status, scheduledAt } = row.log
        if (!isMissedOccurrence(status, scheduledAt, now)) continue
        const bucket = getTimeBucket(row.createdAt)
        counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1)
    }
    if (!counts.size) return null
    const [label, count] = [...counts.entries()].reduce((best, current) =>
        current[1] > best[1] ? current : best
    )
    return { label, count }
}

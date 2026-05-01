import i18n from "@/i18n";

function getUtcDateKey(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function addUtcDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

export function formatNextAvailableAt(nextAvailableAt?: string | null): string {
	if (!nextAvailableAt) {
		return i18n.t("common.noAvailability");
	}

	const nextAvailableDate = new Date(nextAvailableAt);
	if (Number.isNaN(nextAvailableDate.getTime())) {
		return i18n.t("common.noAvailability");
	}

	const now = new Date();
	const nextDateKey = getUtcDateKey(nextAvailableDate);
	const todayKey = getUtcDateKey(now);
	const tomorrowKey = getUtcDateKey(addUtcDays(now, 1));
	const formattedTime = new Intl.DateTimeFormat(i18n.language, {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "UTC",
	}).format(nextAvailableDate);

	if (nextDateKey === todayKey) {
		return i18n.t("common.todayTime", { time: formattedTime });
	}

	if (nextDateKey === tomorrowKey) {
		return i18n.t("common.tomorrowTime", { time: formattedTime });
	}

	const formattedDate = new Intl.DateTimeFormat(i18n.language, {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(nextAvailableDate);

	return i18n.t("common.dateTime", {
		date: formattedDate,
		time: formattedTime,
	});
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
	timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	timeZone: "UTC",
});

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
		return "No availability";
	}

	const nextAvailableDate = new Date(nextAvailableAt);
	if (Number.isNaN(nextAvailableDate.getTime())) {
		return "No availability";
	}

	const now = new Date();
	const nextDateKey = getUtcDateKey(nextAvailableDate);
	const todayKey = getUtcDateKey(now);
	const tomorrowKey = getUtcDateKey(addUtcDays(now, 1));
	const formattedTime = timeFormatter.format(nextAvailableDate);

	if (nextDateKey === todayKey) {
		return `Today, ${formattedTime}`;
	}

	if (nextDateKey === tomorrowKey) {
		return `Tomorrow, ${formattedTime}`;
	}

	return `${dateFormatter.format(nextAvailableDate)}, ${formattedTime}`;
}

export function ratingToFivePointScale(rating?: number | null): number {
	return (rating ?? 0) / 2;
}

export function fivePointRatingToApiRating(rating: number): number {
	return Math.max(1, Math.min(5, rating)) * 2;
}

export function formatAverageRating(rating?: number | null): string {
	return ratingToFivePointScale(rating).toFixed(1);
}

export function formatRatingCount(totalRatings?: number | null): string {
	const count = totalRatings ?? 0;
	return `(${count})`;
}

export function formatReviewCount(totalRatings?: number | null): string {
	const count = totalRatings ?? 0;
	return `${count} review${count === 1 ? "" : "s"}`;
}

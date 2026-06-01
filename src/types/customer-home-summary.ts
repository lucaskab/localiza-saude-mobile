export type CustomerHomeSummary = {
	totalAppointments: number;
	upcomingAppointments: number;
	favoritesCount: number;
};

export type CustomerHomeSummaryResponse = {
	summary: CustomerHomeSummary;
};

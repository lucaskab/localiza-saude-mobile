export interface AppointmentTrend {
	date: string;
	count: number;
}

export interface PopularProcedure {
	procedureId: string;
	procedureName: string;
	count: number;
	revenue: number;
}

export interface RecentRating {
	id: string;
	rating: number;
	comment: string | null;
	customerName: string;
	createdAt: string;
}

export interface TodayAppointments {
	total: number;
	scheduled: number;
	completed: number;
	cancelled: number;
}

export interface MonthlyRevenue {
	currentMonth: number;
	lastMonth: number;
	growthPercentage: number;
}

export interface Ratings {
	averageRating: number;
	totalRatings: number;
	recentRatings: RecentRating[];
}

export interface Appointments {
	upcomingCount: number;
	thisMonthTotal: number;
	lastMonthTotal: number;
	growthPercentage: number;
	weekTrend: AppointmentTrend[];
}

export interface Patients {
	totalUnique: number;
	newThisMonth: number;
}

export interface CancellationRate {
	thisMonth: number;
	lastMonth: number;
}

export interface DashboardData {
	todayAppointments: TodayAppointments;
	monthlyRevenue: MonthlyRevenue;
	ratings: Ratings;
	appointments: Appointments;
	patients: Patients;
	popularProcedures: PopularProcedure[];
	cancellationRate: CancellationRate;
}

export interface GetDashboardResponse {
	todayAppointments: TodayAppointments;
	monthlyRevenue: MonthlyRevenue;
	ratings: Ratings;
	appointments: Appointments;
	patients: Patients;
	popularProcedures: PopularProcedure[];
	cancellationRate: CancellationRate;
}

export type HealthInsurancePlan = {
	id: string;
	name: string;
};

export type HealthInsurancePlansResponse = {
	healthInsurancePlans: HealthInsurancePlan[];
};

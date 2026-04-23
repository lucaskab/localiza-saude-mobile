export interface Category {
	id: string;
	name: string;
	icon: string;
}

export interface Procedure {
	id: string;
	name: string;
	description: string;
	duration: number;
	price: number;
}

export interface Professional {
	id: string;
	name: string;
	specialty: string;
	image: string;
	rating: number;
	reviews: number;
	experience: number;
	nextAvailable: string;
	verified: boolean;
	distance: string;
	categoryId: string;
	price: number;
	procedures: Procedure[];
}

export const categories: Category[] = [
	{ id: "all", name: "All", icon: "🏥" },
	{ id: "cardiology", name: "Cardiology", icon: "❤️" },
	{ id: "dermatology", name: "Dermatology", icon: "✨" },
	{ id: "pediatrics", name: "Pediatrics", icon: "👶" },
	{ id: "orthopedics", name: "Orthopedics", icon: "🦴" },
	{ id: "psychology", name: "Psychology", icon: "🧠" },
	{ id: "dentistry", name: "Dentistry", icon: "🦷" },
	{ id: "ophthalmology", name: "Ophthalmology", icon: "👁️" },
];

export const professionals: Professional[] = [
	{
		id: "1",
		name: "Dr. Sarah Johnson",
		specialty: "Cardiologist",
		image: "https://i.pravatar.cc/150?img=1",
		rating: 4.9,
		reviews: 127,
		experience: 15,
		nextAvailable: "Today, 2:00 PM",
		verified: true,
		distance: "2.5 km",
		categoryId: "cardiology",
		price: 150,
		procedures: [
			{
				id: "1-1",
				name: "Initial Consultation",
				description:
					"Comprehensive cardiovascular assessment and health review",
				duration: 45,
				price: 150,
			},
			{
				id: "1-2",
				name: "ECG/EKG Test",
				description: "Electrocardiogram to measure heart's electrical activity",
				duration: 30,
				price: 120,
			},
			{
				id: "1-3",
				name: "Echocardiogram",
				description: "Ultrasound imaging of the heart",
				duration: 60,
				price: 250,
			},
			{
				id: "1-4",
				name: "Follow-up Visit",
				description: "Review test results and treatment plan",
				duration: 30,
				price: 100,
			},
		],
	},
	{
		id: "2",
		name: "Dr. Michael Chen",
		specialty: "Dermatologist",
		image: "https://i.pravatar.cc/150?img=33",
		rating: 4.8,
		reviews: 98,
		experience: 12,
		nextAvailable: "Tomorrow, 10:00 AM",
		verified: true,
		distance: "1.8 km",
		categoryId: "dermatology",
		price: 120,
		procedures: [
			{
				id: "2-1",
				name: "Skin Consultation",
				description: "Complete skin examination and assessment",
				duration: 30,
				price: 120,
			},
			{
				id: "2-2",
				name: "Acne Treatment",
				description: "Professional acne treatment and care plan",
				duration: 45,
				price: 150,
			},
			{
				id: "2-3",
				name: "Mole Removal",
				description: "Safe removal of benign skin lesions",
				duration: 30,
				price: 200,
			},
			{
				id: "2-4",
				name: "Skin Biopsy",
				description: "Sample collection for laboratory analysis",
				duration: 20,
				price: 180,
			},
		],
	},
	{
		id: "3",
		name: "Dr. Emily Rodriguez",
		specialty: "Pediatrician",
		image: "https://i.pravatar.cc/150?img=5",
		rating: 4.9,
		reviews: 156,
		experience: 18,
		nextAvailable: "Today, 4:30 PM",
		verified: true,
		distance: "3.2 km",
		categoryId: "pediatrics",
		price: 100,
		procedures: [
			{
				id: "3-1",
				name: "Well-Child Visit",
				description: "Routine checkup and developmental assessment",
				duration: 30,
				price: 100,
			},
			{
				id: "3-2",
				name: "Vaccination",
				description: "Immunization according to schedule",
				duration: 15,
				price: 50,
			},
			{
				id: "3-3",
				name: "Sick Visit",
				description: "Evaluation and treatment of illness",
				duration: 20,
				price: 120,
			},
			{
				id: "3-4",
				name: "Growth Assessment",
				description: "Height, weight, and development tracking",
				duration: 25,
				price: 80,
			},
		],
	},
	{
		id: "4",
		name: "Dr. David Kim",
		specialty: "Orthopedist",
		image: "https://i.pravatar.cc/150?img=12",
		rating: 4.7,
		reviews: 89,
		experience: 10,
		nextAvailable: "Mar 26, 9:00 AM",
		verified: true,
		distance: "4.1 km",
		categoryId: "orthopedics",
		price: 140,
		procedures: [
			{
				id: "4-1",
				name: "Joint Consultation",
				description: "Evaluation of joint pain and mobility issues",
				duration: 40,
				price: 140,
			},
			{
				id: "4-2",
				name: "X-Ray Review",
				description: "Analysis of imaging results",
				duration: 20,
				price: 100,
			},
			{
				id: "4-3",
				name: "Physical Therapy Plan",
				description: "Customized rehabilitation program",
				duration: 45,
				price: 130,
			},
			{
				id: "4-4",
				name: "Fracture Care",
				description: "Treatment and management of bone fractures",
				duration: 60,
				price: 250,
			},
		],
	},
	{
		id: "5",
		name: "Dr. Amanda Wilson",
		specialty: "Psychologist",
		image: "https://i.pravatar.cc/150?img=9",
		rating: 4.9,
		reviews: 134,
		experience: 14,
		nextAvailable: "Today, 6:00 PM",
		verified: true,
		distance: "2.0 km",
		categoryId: "psychology",
		price: 130,
		procedures: [
			{
				id: "5-1",
				name: "Initial Assessment",
				description: "Comprehensive psychological evaluation",
				duration: 60,
				price: 150,
			},
			{
				id: "5-2",
				name: "Individual Therapy",
				description: "One-on-one counseling session",
				duration: 50,
				price: 130,
			},
			{
				id: "5-3",
				name: "Couples Therapy",
				description: "Relationship counseling session",
				duration: 60,
				price: 180,
			},
			{
				id: "5-4",
				name: "Group Therapy",
				description: "Group counseling session",
				duration: 90,
				price: 100,
			},
		],
	},
	{
		id: "6",
		name: "Dr. Robert Martinez",
		specialty: "Dentist",
		image: "https://i.pravatar.cc/150?img=15",
		rating: 4.8,
		reviews: 112,
		experience: 16,
		nextAvailable: "Tomorrow, 11:00 AM",
		verified: true,
		distance: "2.8 km",
		categoryId: "dentistry",
		price: 90,
		procedures: [
			{
				id: "6-1",
				name: "Dental Checkup",
				description: "Routine examination and cleaning",
				duration: 45,
				price: 90,
			},
			{
				id: "6-2",
				name: "Teeth Whitening",
				description: "Professional tooth whitening treatment",
				duration: 60,
				price: 200,
			},
			{
				id: "6-3",
				name: "Cavity Filling",
				description: "Treatment of dental cavities",
				duration: 30,
				price: 150,
			},
			{
				id: "6-4",
				name: "Root Canal",
				description: "Root canal therapy",
				duration: 90,
				price: 400,
			},
		],
	},
	{
		id: "7",
		name: "Dr. Lisa Anderson",
		specialty: "Ophthalmologist",
		image: "https://i.pravatar.cc/150?img=10",
		rating: 4.9,
		reviews: 145,
		experience: 20,
		nextAvailable: "Mar 27, 1:00 PM",
		verified: true,
		distance: "3.5 km",
		categoryId: "ophthalmology",
		price: 160,
		procedures: [
			{
				id: "7-1",
				name: "Eye Examination",
				description: "Comprehensive vision and eye health check",
				duration: 40,
				price: 160,
			},
			{
				id: "7-2",
				name: "Contact Lens Fitting",
				description: "Professional contact lens consultation",
				duration: 30,
				price: 120,
			},
			{
				id: "7-3",
				name: "Glaucoma Screening",
				description: "Tests for glaucoma detection",
				duration: 25,
				price: 140,
			},
			{
				id: "7-4",
				name: "Cataract Consultation",
				description: "Evaluation for cataract surgery",
				duration: 45,
				price: 180,
			},
		],
	},
	{
		id: "8",
		name: "Dr. James Thompson",
		specialty: "Cardiologist",
		image: "https://i.pravatar.cc/150?img=13",
		rating: 4.7,
		reviews: 95,
		experience: 11,
		nextAvailable: "Today, 3:00 PM",
		verified: false,
		distance: "5.2 km",
		categoryId: "cardiology",
		price: 145,
		procedures: [
			{
				id: "8-1",
				name: "Cardiac Consultation",
				description: "Heart health assessment and consultation",
				duration: 40,
				price: 145,
			},
			{
				id: "8-2",
				name: "Stress Test",
				description: "Exercise stress test for heart function",
				duration: 60,
				price: 220,
			},
			{
				id: "8-3",
				name: "Holter Monitor",
				description: "24-hour heart rhythm monitoring setup",
				duration: 20,
				price: 150,
			},
			{
				id: "8-4",
				name: "Blood Pressure Check",
				description: "Comprehensive blood pressure evaluation",
				duration: 15,
				price: 60,
			},
		],
	},
];

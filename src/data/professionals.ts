export interface Category {
	id: string;
	name: string;
	icon: string;
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
	},
];

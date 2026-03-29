export interface Professional {
	id: string;
	name: string;
	specialty: string;
	image: string;
	distance: string;
}

export interface Appointment {
	id: string;
	professional: Professional;
	date: string;
	time: string;
	type: string;
	status: "upcoming" | "completed";
}

export const mockAppointments: Appointment[] = [
	{
		id: "1",
		professional: {
			id: "p1",
			name: "Dr. Sarah Johnson",
			specialty: "Cardiologist",
			image: "https://i.pravatar.cc/150?img=1",
			distance: "2.5 km",
		},
		date: "March 25, 2024",
		time: "10:00 AM - 10:30 AM",
		type: "In-person consultation",
		status: "upcoming",
	},
	{
		id: "2",
		professional: {
			id: "p2",
			name: "Dr. Michael Chen",
			specialty: "Dermatologist",
			image: "https://i.pravatar.cc/150?img=33",
			distance: "1.8 km",
		},
		date: "March 27, 2024",
		time: "2:00 PM - 2:45 PM",
		type: "Video consultation",
		status: "upcoming",
	},
	{
		id: "3",
		professional: {
			id: "p3",
			name: "Dr. Emily Rodriguez",
			specialty: "Pediatrician",
			image: "https://i.pravatar.cc/150?img=5",
			distance: "3.2 km",
		},
		date: "March 20, 2024",
		time: "9:00 AM - 9:30 AM",
		type: "In-person consultation",
		status: "completed",
	},
	{
		id: "4",
		professional: {
			id: "p4",
			name: "Dr. David Kim",
			specialty: "Orthopedist",
			image: "https://i.pravatar.cc/150?img=12",
			distance: "4.1 km",
		},
		date: "March 18, 2024",
		time: "11:00 AM - 11:45 AM",
		type: "Follow-up consultation",
		status: "completed",
	},
	{
		id: "5",
		professional: {
			id: "p5",
			name: "Dr. Amanda Wilson",
			specialty: "Psychologist",
			image: "https://i.pravatar.cc/150?img=9",
			distance: "2.0 km",
		},
		date: "March 15, 2024",
		time: "3:00 PM - 4:00 PM",
		type: "Video consultation",
		status: "completed",
	},
];

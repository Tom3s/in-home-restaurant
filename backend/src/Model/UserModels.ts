interface User {
	id: number;
	name: string;
	email: string;
	passwordhash: string;
	role?: string;
}

interface SessionDetails {
	userId: number;
	username: string;
	email: string;
	role: string;
	logindate: Date;
}

export type { User, SessionDetails };
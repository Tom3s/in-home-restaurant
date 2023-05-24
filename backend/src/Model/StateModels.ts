interface ApiResponse {
	success: boolean;
	status: number;
	message: string;
	data?: any;
}

export type { ApiResponse };
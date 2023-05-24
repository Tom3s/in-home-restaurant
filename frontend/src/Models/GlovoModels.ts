interface Product {
	id: number;
	name: string;
	price: number;
	imageUrl: string;
	store?: string;
	url?: string;
	selected?: boolean;
}

export type { Product };
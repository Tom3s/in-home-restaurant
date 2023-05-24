interface Product {
	id: number;
	name: string;
	price: number;
	imageUrl: string;
	store?: string;
	url?: string;
}

interface GlovoResults {
	results: [
		{
			products: Product[];
		}
	],
	totalProducts: number;
}

interface ProductMatch {
	productId: number;
	url: string;
	store: string;
}

interface SavableProductMatches {
	productName: string;
	matches: ProductMatch[];
}

export const GLOVO_API_URLS = [
	{
		store: 'Kaufland',
		url: 'http://api.glovoapp.com/v3/stores/52287/addresses/102892/',
	},
	{
		store: 'Auchan',
		url: 'http://api.glovoapp.com/v3/stores/272457/addresses/462348/',
	},
	{
		store: 'Profi',
		url: 'http://api.glovoapp.com/v3/stores/330531/addresses/524146/',
	},
	{
		store: 'Carrefour',
		url: 'http://api.glovoapp.com/v3/stores/316638/addresses/519071/',
	},
]

export type { Product, GlovoResults, ProductMatch, SavableProductMatches };
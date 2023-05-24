import { Pool } from "pg";
import { GLOVO_API_URLS, GlovoResults, Product, SavableProductMatches } from "../Model/GlovoModels";
import { ApiResponse } from "../Model/StateModels";
import LOGGER from "../Logger/logger";

class GlovoRepository {

	private databasePool: Pool;
	private loggerPrefix: string = '[GlovoRepository]';

	constructor() {
		this.databasePool = new Pool({
			connectionString: process.env.PG_CONN_STRING,
			max: 20,
			connectionTimeoutMillis: 10000,
		});
	}

	async searchGlovoProducts(searchTerm: string): Promise<ApiResponse> {
		searchTerm = searchTerm.trim().toLowerCase();
		var foundProducts: Product[] = [];

		const fetchPromises = GLOVO_API_URLS.map(store =>
			fetch(store.url + "search?query=" + searchTerm)
				.then(async response => (await response.json()) as GlovoResults)
				.then((data: GlovoResults) => {
					const products = data.results[0].products;
					for (const product of products) {
						if (!product.name.toLowerCase().includes(searchTerm)) {
							continue;
						}
						foundProducts.push({
							id: product.id,
							name: product.name,
							price: product.price,
							imageUrl: product.imageUrl,
							store: store.store,
							url: store.url,
						});
					}
				})
		);

		await Promise.all(fetchPromises);

		foundProducts.sort((a, b) => a.price - b.price);

		if (foundProducts.length == 0) {
			return {
				success: false,
				status: 404,
				message: "No products found.",
			};
		}

		return {
			success: true,
			status: 200,
			message: "Found products.",
			data: foundProducts,
		};
	}

	async saveBulkProducts(products: SavableProductMatches): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		products.productName = products.productName.trim().toLowerCase();

		const productIdQuery = {
			text: 'SELECT id FROM prices WHERE name = $1',
			values: [products.productName],
		};
		var productId = await client.query(productIdQuery);

		if (productId.rows.length == 0) {
			const saveProductQuery = {
				text: 'INSERT INTO prices(name) VALUES($1) RETURNING id',
				values: [products.productName],
			};
			productId = await client.query(saveProductQuery);
			LOGGER.info(`${this.loggerPrefix} Saved new product '${products.productName}' to database.`);
		}

		var savePriceMatchesQueryText = 'INSERT INTO price_matches(price_id, product_id, url, store) VALUES ';
		products.matches.forEach((match, index) => {
			savePriceMatchesQueryText += `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}), `;
		});
		savePriceMatchesQueryText = savePriceMatchesQueryText.slice(0, -2);
		savePriceMatchesQueryText += ' ON CONFLICT DO NOTHING;';
		const savePriceMatchesQuery = {
			text: savePriceMatchesQueryText,
			values: products.matches.flatMap(match => [productId.rows[0].id, match.productId, match.url, match.store]),
		};
		try {
			await client.query(savePriceMatchesQuery);
		} catch (error: any) {
			LOGGER.error(`${this.loggerPrefix} Error saving price matches for product '${products.productName}' to database: ${error}`);
			LOGGER.error(`${this.loggerPrefix} Query: ${savePriceMatchesQueryText}`);
			LOGGER.error(`${this.loggerPrefix} Values: ${products.matches.flatMap(match => [productId.rows[0].id, match.productId, match.url])}`);
			LOGGER.error(`${error.stack}`);
			client.release();
			return {
				success: false,
				status: 500,
				message: "Error saving price matches to database.",
			};
		}
		client.release();

		LOGGER.info(`${this.loggerPrefix} Saved ${products.matches.length} price matches for product '${products.productName}' to database.`);

		return {
			success: true,
			status: 200,
			message: "Saved price matches.",
		};
	}

	private transfromProductMatchesToFetchableObjects(productMatches: { productId: number, url: string, store: string }[]): any[] {
		const fetchableObjects: {url: string, store: string, productIds: number[]}[] = [];

		productMatches.forEach(match => {
			const fetchableObject = fetchableObjects.find(fetchableObject => fetchableObject.url == match.url && fetchableObject.store == match.store);
			if (fetchableObject) {
				fetchableObject.productIds.push(match.productId);
			} else {
				fetchableObjects.push({
					url: match.url,
					store: match.store,
					productIds: [match.productId],
				});
			}
		}
		);

		return fetchableObjects;
	}

	async getCheapestProduct(productName: string): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		const productIdQuery = {
			text: 'SELECT id FROM prices WHERE name = $1',
			values: [productName],
		};
		const productIdResult = await client.query(productIdQuery);

		if (productIdResult.rows.length == 0) {
			return {
				success: false,
				status: 404,
				message: "No products found.",
			};
		}

		const priceMatchesQuery = {
			text: 'SELECT product_id, url, store FROM price_matches WHERE price_id = $1',
			values: [productIdResult.rows[0].id],
		};

		const priceMatchesResult = await client.query(priceMatchesQuery);

		const productMatches = priceMatchesResult.rows.map(row => {
			return {
				productId: parseInt(row.product_id),
				url: row.url as string,
				store: row.store as string,
			};
		});

		client.release();

		const fetchableObjects = this.transfromProductMatchesToFetchableObjects(productMatches);

		var foundProducts: Product[] = [];
		
		const fetchPromises = fetchableObjects.map(fetchableObject =>
			fetch(fetchableObject.url + "search?query=" + productName)
				.then(async response => (await response.json()) as GlovoResults)
				.then((data: GlovoResults) => {
					const products = data.results[0].products;
					const filteredProducts = products.filter(product => fetchableObject.productIds.includes(product.id));
					for (const product of filteredProducts) {
						foundProducts.push({
							id: product.id,
							name: product.name,
							price: product.price,
							imageUrl: product.imageUrl,
							store: fetchableObject.store,
						});
					}
				})
		);

		await Promise.all(fetchPromises);

		foundProducts.sort((a, b) => a.price - b.price);

		return {
			success: true,
			status: 200,
			message: "Found products.",
			data: foundProducts[0],
		};

	}

}

export default GlovoRepository;
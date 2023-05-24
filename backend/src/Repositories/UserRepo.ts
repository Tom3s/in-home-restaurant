import { Pool } from "pg";
import { ApiResponse } from "../Model/StateModels";
import LOGGER from "../Logger/logger";

class UserRepository {

	private databasePool: Pool;
	private loggerPrefix: string = '[UserRepository]';

	constructor() {
		this.databasePool = new Pool({
			connectionString: process.env.PG_CONN_STRING,
			max: 20,
			connectionTimeoutMillis: 10000,
		});
	}

	/**
	 * Checks if a user with the provided username exists.
	 * @param {string} username - The username to check.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the check.
	 * The ApiResponse object contains a `data` property indicating whether the user exists (true) or not (false).
	 */
	async checkIfUsernameExists(username: string): Promise<ApiResponse> {

		const client = await this.databasePool.connect();
		
		const query = {
			text: 'SELECT id FROM users WHERE username = $1',
			values: [username],
		};

		try {
			const result = await client.query(query);
			client.release();

			if (result.rowCount > 0) {
				return {
					success: true,
					status: 200,
					message: `User '${username}' exists.`,
					data: result.rows[0].id,
				};
			}

			return {
				success: false,
				status: 404,
				message: `User '${username}' does not exist.`,
			};
		} catch (error: any) {
			const message = `Error checking if user '${username}' exists.`;
			LOGGER.error(`${this.loggerPrefix} ${message}`);
			LOGGER.error(error.stack);

			client.release();

			return {
				success: false,
				status: 500,
				message: message,
			};
		}
	}

	/**
	 * Checks if a user with the provided email exists.
	 * @param {string} email - The email to check.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the check.
	 * The ApiResponse object contains a `data` property indicating whether the user exists (true) or not (false).
	 */
	async checkIfEmailExists(email: string): Promise<ApiResponse> {

		const client = await this.databasePool.connect();

		const query = {
			text: 'SELECT id FROM users WHERE email = $1',
			values: [email],
		};

		try {
			const result = await client.query(query);
			client.release();

			if (result.rowCount > 0) {
				return {
					success: true,
					status: 200,
					message: `Email '${email}' exists.`,
					data: result.rows[0].id,
				};
			}

			return {
				success: false,
				status: 404,
				message: `Email '${email}' does not exist.`,
			};
		} catch (error: any) {
			const message = `Error checking if email '${email}' exists.`;
			LOGGER.error(`${this.loggerPrefix} ${message}`);
			LOGGER.error(error.stack);

			client.release();

			return {
				success: false,
				status: 500,
				message: message,
			};
		}
	}

	async getEmailByUserID(userID: number): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		const query = {
			text: 'SELECT email FROM users WHERE id = $1',
			values: [userID],
		};

		try {
			const result = await client.query(query);
			client.release();

			if (result.rowCount > 0) {
				return {
					success: true,
					status: 200,
					message: `Email found for user ID ${userID}.`,
					data: result.rows[0].email,
				};
			}

			return {
				success: false,
				status: 404,
				message: `User not found for ID ${userID}.`,
			};
		} catch (error: any) {
			const message = `Error getting email for user ID ${userID}.`;
			LOGGER.error(`${this.loggerPrefix} ${message}`);
			LOGGER.error(error.stack);

			client.release();

			return {
				success: false,
				status: 500,
				message: message,
			};
		}
	}
}

export default UserRepository;
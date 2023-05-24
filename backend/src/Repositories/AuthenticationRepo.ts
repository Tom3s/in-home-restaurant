import { Pool } from "pg";
import LOGGER from "../Logger/logger";
import { ApiResponse } from "../Model/StateModels";

class AuthenticationRepository {

	private databasePool: Pool;
	private loggerPrefix: string = '[AuthenticationRepository]';

	constructor() {
		this.databasePool = new Pool({
			connectionString: process.env.PG_CONN_STRING,
			max: 20,
			connectionTimeoutMillis: 10000,
		});
	}

	/**
	 * Registers a user with the provided username, email, and password hash.
	 * @param {string} username - The username of the user to register.
	 * @param {string} email - The email of the user to register.
	 * @param {string} passwordHash - The hashed password of the user to register.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the registration.
	 */
	async registerUser(username: string, email: string, passwordHash: string): Promise<ApiResponse> {

		const client = await this.databasePool.connect();

		const query = {
			text: 'INSERT INTO users(username, email, passwordhash) VALUES($1, $2, $3)',
			values: [username, email, passwordHash],
		};

		try {
			await client.query(query);
			const message = `User '${username}' registered.`;
			LOGGER.info(`${this.loggerPrefix} ${message}`);

			client.release();

			return {
				success: true,
				status: 200,
				message: message,
			};
		} catch (error: any) {
			const message = `Error registering user '${username}'.`;
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
	 * Verifies the user's password with the provided username and password hash.
	 * @param {string} username - The username of the user to verify.
	 * @param {string} passwordHash - The hashed password to verify.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the verification. 
	 * The data field of the ApiResponse object will contain the user's role if the verification was successful.
	 */
	async verifyUserPasswordWithUsername(username: string, passwordHash: string): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		const query = {
			text: 'SELECT role FROM users WHERE username = $1 AND passwordhash = $2',
			values: [username, passwordHash],
		}

		try {
			const result = await client.query(query);

			if (result.rowCount === 0) {
				const message = `Incorrect password for user '${username}'.`;
				LOGGER.info(`${this.loggerPrefix} ${message}`);

				client.release();

				return {
					success: false,
					status: 400,
					message: message,
				};
			}

			const message = `User '${username}' logged in.`;
			LOGGER.info(`${this.loggerPrefix} ${message}`);

			client.release();

			return {
				success: true,
				status: 200,
				message: message,
				data: result.rows[0].role,
			};
		} catch (error: any) {
			const message = `Error logging in user '${username}'.`;
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
	 * Verifies the user's password with the provided email and password hash.
	 * @param {string} email - The email of the user to verify.
	 * @param {string} passwordHash - The hashed password to verify.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the verification. The data field of the ApiResponse object will contain the user's id if the verification was successful.
	 */
	async verifyUserPasswordWithEmail(email: string, passwordHash: string): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		const query = {
			text: 'SELECT id FROM users WHERE email = $1 AND passwordhash = $2',
			values: [email, passwordHash],
		}

		try {
			const result = await client.query(query);

			// This should be checked before calling this function.
			if (result.rowCount === 0) {
				const message = `Incorrect password for user with email '${email}'.`;
				LOGGER.info(`${this.loggerPrefix} ${message}`);

				client.release();

				return {
					success: false,
					status: 400,
					message: message,
				};
			}

			const message = `User with email '${email}' logged in.`;
			LOGGER.info(`${this.loggerPrefix} ${message}`);

			client.release();

			return {
				success: true,
				status: 200,
				message: message,
				data: result.rows[0].id,
			};
		} catch (error: any) {
			const message = `Error logging in user with email '${email}'.`;
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
	 * Updates the password hash for the user with the provided user ID.
	 * @param {number} userId - The ID of the user to update.
	 * @param {string} passwordHash - The new hashed password.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the update.
	 */
	async updatePasswordHashForUserWithId(userId: number, passwordHash: string): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		const query = {
			text: 'UPDATE users SET passwordhash = $1 WHERE id = $2 RETURNING id',
			values: [passwordHash, userId],
		};

		try {
			const result = await client.query(query);
			
			// This should be checked before calling this function.
			if (result.rowCount === 0) {
				const message = `User with id '${userId}' not found.`;
				LOGGER.info(`${this.loggerPrefix} ${message}`);

				client.release();

				return {
					success: false,
					status: 404,
					message: message,
				};
			}

			const message = `Password updated for user with id '${userId}'.`;
			LOGGER.info(`${this.loggerPrefix} ${message}`);

			client.release();

			return {
				success: true,
				status: 200,
				message: message,
			};
		} catch (error: any) {
			const message = `Error updating password for user with id '${userId}'.`;
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
	 * Deletes the user with the provided user ID.
	 * @param {number} userId - The ID of the user to delete.
	 * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object indicating the success or failure of the deletion.
	 */
	async deleteUserWithId(userId: number): Promise<ApiResponse> {
		const client = await this.databasePool.connect();

		const query = {
			text: 'DELETE FROM users WHERE id = $1',
			values: [userId],
		};

		try {
			await client.query(query);

			const message = `User with id '${userId}' deleted.`;
			LOGGER.info(`${this.loggerPrefix} ${message}`);

			client.release();

			return {
				success: true,
				status: 200,
				message: message,
			};
		} catch (error: any) {
			const message = `Error deleting user with id '${userId}'.`;
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

	static isPasswordStrongEnough(password: string): boolean {
		const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[\d@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return regex.test(password);
	}

	static isEmailValid(email: string): boolean {
		const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return regex.test(email);
    }

	static generateRegistrationToken(data: any): string {
		const jwt = require('jsonwebtoken');

		const jwtSecret = process.env.JWT_SECRET_KEY;

		data.date = new Date();

		return jwt.sign(data, jwtSecret);
	}

	static generateLoginSessionToken(data: any): string {
		const jwt = require('jsonwebtoken');

		const jwtSecret = process.env.JWT_SECRET_KEY;

		data.date = new Date();

		return jwt.sign(data, jwtSecret);
	}

	static decodeTokenData(token: string): any {
		const jwt = require('jsonwebtoken');

		const jwtSecret = process.env.JWT_SECRET_KEY;

		return jwt.verify(token, jwtSecret);
	}

	static generatePasswordHash(password: string): string {
		const { createHash } = require('crypto');

        return createHash('sha256').update(password).digest('hex');
	}
}

export default AuthenticationRepository;
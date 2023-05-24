import express, { Express, Request, Response } from 'express';
import { ApiResponse } from '../Model/StateModels';
import Controller from '../Controller/Controller';


function setupRoutes(app: Express, controller: Controller): void {
	app.get('/', (request: Request, response: Response) => {
		response.send('Express + TypeScript Server');
	});

	// POST /api/register - register a new user
	app.post('/api/register', async (request: Request, response: Response) => {

		const body = request.body;

		if (!body) {
			response.status(400).send('Missing request body.');
			return;
		}

		if (!body.username || !body.email || !body.password) {
			var missingFields: string[] = [];
			if (!body.username) {
				missingFields.push('username');
			}
			if (!body.email) {
				missingFields.push('email');
			}
			if (!body.password) {
				missingFields.push('password');
			}
			const responseMessage = `Missing required fields: ${missingFields.join(', ')}`;
			response.status(400).send(responseMessage);
			return;
		}

		const username = body.username;
		const email = body.email;
		const password = body.password;

		const registerResponse: ApiResponse = await controller.getUserRegistrationToken(username, email, password);

		if (registerResponse.success) {
			response.status(registerResponse.status)
					.send(registerResponse.data);
		} else {
			response.status(registerResponse.status)
					.send(registerResponse.message);
		}
	});

	// GET /api/register/:token - confirm a user's email address
	app.get('/api/register/:token', async (request: Request, response: Response) => {
		const token = request.params.token;

		if (!token) {
			response.status(400).send('Missing token.');
			return;
		}

		const confirmResponse: ApiResponse = await controller.confirmUserRegistration(token);

		// if (confirmResponse.success) {
		// 	response.status(confirmResponse.status)
		// 			.send(confirmResponse.message);
		// } else {
		// 	response.status(confirmResponse.status)
		// 			.send(confirmResponse.message);
		// }
		response.status(confirmResponse.status).send(confirmResponse.message);
	});

	// POST /api/login - login a user
	app.post('/api/login', async (request: Request, response: Response) => {
		const username = request.body.username;
		const password = request.body.password;

		const loginResponse: ApiResponse = await controller.getLoginSession(username, password);

		if (loginResponse.success) {
			response.status(loginResponse.status)
					.send(loginResponse.data);
		} else {
			response.status(loginResponse.status)
					.send(loginResponse.message);
		}
	});

	
}

export default setupRoutes;
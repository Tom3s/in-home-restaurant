import LOGGER from "../Logger/logger";
import { ApiResponse } from "../Model/StateModels";
import { SessionDetails } from "../Model/UserModels";
import AuthenticationRepository from "../Repositories/AuthenticationRepo";
import UserRepository from "../Repositories/UserRepo";

class Controller {
	private loggerPrefix: string = '[Controller]';
	private authenticationRepository: AuthenticationRepository;
	private userRepository: UserRepository;

	constructor() {
		this.authenticationRepository = new AuthenticationRepository();
		this.userRepository = new UserRepository();
	}

	async getUserRegistrationToken(username: string, email: string, password: string): Promise<ApiResponse> {
		const usernameExists = await this.userRepository.checkIfUsernameExists(username);
		if (usernameExists.success && usernameExists.data) {
			return {
				success: false,
				status: 400,
				message: `Username '${username}' already exists.`,
			};
		}

		if (!AuthenticationRepository.isEmailValid(email)) {
			return {
				success: false,
				status: 400,
				message: `Email '${email}' is not valid.`,
			};
		}

		const emailExists = await this.userRepository.checkIfEmailExists(email);
		if (emailExists.success && emailExists.data) {
			return {
				success: false,
				status: 400,
				message: `Email '${email}' already exists.`,
			};
		}

		if (!AuthenticationRepository.isPasswordStrongEnough(password)) {
			return {
				success: false,
				status: 400,
				message: `Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number or special character.`,
			}
		}

		const data = {
			username: username,
			email: email,
			password: password,
		}

		LOGGER.info(`${this.loggerPrefix} Generating registration token for user '${username}'.`);

		return {
			success: true,
			status: 200,
			message: `User registration token generated. It is valid for 10 minutes. Please check your email.`,
			data: AuthenticationRepository.generateRegistrationToken(data),
		}
	}

	async confirmUserRegistration(registrationToken: string): Promise<ApiResponse> {
		try {
			var tokenData = AuthenticationRepository.decodeTokenData(registrationToken);
		} catch (error: any) {
			return {
				success: false,
				status: 400,
				message: error.message,
			};
		}

		const tokenDate = new Date(tokenData.date);
		const currentDate = new Date();

		const timeDifference = currentDate.getTime() - tokenDate.getTime();
		const timeDifferenceInMinutes = timeDifference / 1000 / 60;

		if (timeDifferenceInMinutes > 10) {
			return {
				success: false,
				status: 400,
				message: `Registration token has expired.`,
			};
		}

		const username = tokenData.username;

		const usernameExists = await this.userRepository.checkIfUsernameExists(username);
		if (usernameExists.success && usernameExists.data) {
			return {
				success: false,
				status: 400,
				message: `Token already used.`,
			};
		}

		const email = tokenData.email;
		const password = tokenData.password;

		const passwordHash = await AuthenticationRepository.generatePasswordHash(password);

		LOGGER.info(`${this.loggerPrefix} User '${username}' confirmed their registration.`);

		return this.authenticationRepository.registerUser(username, email, passwordHash);
	}

	async getLoginSession(username: string, password: string): Promise<ApiResponse> {
		const userIdResponse = await this.userRepository.checkIfUsernameExists(username);
		if (!userIdResponse.success) {
			return userIdResponse;
		}

		const userId = userIdResponse.data;

		const passwordHash = AuthenticationRepository.generatePasswordHash(password);

		const verificationResponse = await this.authenticationRepository.verifyUserPasswordWithUsername(username, passwordHash);
		if (!verificationResponse.success) {
			return verificationResponse;
		}

		const emailResponse = await this.userRepository.getEmailByUserID(userId);
		if (!emailResponse.success) {
			return emailResponse;
		}

		const sessionDetails: SessionDetails = {
			userId: userId,
			username: username,
			email: emailResponse.data,
			role: verificationResponse.data,
			logindate: new Date(),
		}

		const token = AuthenticationRepository.generateLoginSessionToken(sessionDetails);

		LOGGER.info(`${this.loggerPrefix} User '${username}' logged in.`);

		return {
			success: true,
			status: 200,
			message: `Login session token generated. It is valid for 1 hour.`,
			data: {
				sessiontoken: token,
				role: sessionDetails.role,
				userId: sessionDetails.userId,
				username: sessionDetails.username,
				email: sessionDetails.email,
			},
		}
	}
}

export default Controller;
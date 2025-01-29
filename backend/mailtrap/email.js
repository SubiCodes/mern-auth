import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationToken}", verificationToken),
			category: "Email Verification",
		});

		console.log("Email sent successfully", response);
	} catch (error) {
		console.error(`Error sending verification`, error);

		throw new Error(`Error sending verification email: ${error}`);
	}
};

export const sendWelcomeEmail = async (email, name) => {

	const recipient = [{email}];

	try {

		const res = await mailtrapClient.send({
			from: sender,
			to: recipient,
			template_uuid: "a8f8560c-90e8-4a39-bde2-dd5c19805435",
			template_variables: {
			  "name": name,
			  "company_info_name": "MERN Stack Auth"
			}
		  });

		console.log("Welcome email sent successfully", res)

	} catch (error) {
		console.error(`Error sending welcome email `, error);
		throw new Error(`Error sending welcome email: ${error}`);
	}

};

export const sendPasswordResetEmail = async (email, resetURL) => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
			category: "Password Reset",
		});
	} catch (error) {
		console.error(`Error sending password reset email`, error);

		throw new Error(`Error sending password reset email: ${error}`);
	}
};

export const sendResetSuccessEmail = async (email) => {
	const recipient = [{email}];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Password Reset Successful",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
			category: "Password Reset Successful",
		});

		console.log("Password reset success email sent.", response);
		
	} catch (error) {
		console.error("Password reset success email not sent.", error);
		throw new Error(`Password reset success email not sent: ${error}`);
	}
}
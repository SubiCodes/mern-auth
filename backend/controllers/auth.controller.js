import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

import {User} from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/email.js";

dotenv.config();

export const signup = async (req, res) => {
    const {email, password, name} = req.body;
    try {
        if(!email || !password || !name){
            return res.status(400).json({message: "All fields are required"});
        }

        const userAlreadyExists = await User.findOne({email: email});
        if(userAlreadyExists){
            return res.status(400).json({success: false, message: "User already exists."});
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, //24 hours
        });

        await user.save();

        generateTokenAndSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({success: true, message: "User created successfully", user: {
            ...user._doc,
            password: undefined, 
        }});

    } catch (error) {
        return res.status(500).json({success: false, message: `Internal Server Error: ${error}`});
    }

};

export const verifyEmail = async (req, res) => {

    const { code } = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }, 
        });

        if(!user){
            return res.status(400).json({success: false, message: "Invalid or expired verification code."})
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({success: true, message: "Verification Successful!", user: {...user._doc, password: undefined}});

    } catch (error) {
        console.log("error in verifyEmail ", error);
		res.status(500).json({ success: false, message: "Server error" });
    }

}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({success: false, message: "Invalid Credentials."})
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({success: false, message: "Invalid Credentials."})
        }

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Logged in successfully!",
            user:{
                ...user._doc,
                password: undefined,
            },
        });

    } catch (error) {
        console.error("Error in Login", error);
        return res.status(500).json({success: false, message: `Error Logging in: ${error}`});
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({success: true, message: "Logged out successfully."})
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const resetPassword = async (req, res) => {
    try {
       const {token} = req.params;
       const {password} = req.body;
       
       
       const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiresAt: {$gt: Date.now()},
       });

       if(!user){
        return res.status(400).json({success: false, message: "Invalid or expire reset token."})
       }

       const hashedPassword = await bcryptjs.hash(password, 10);

       user.password = hashedPassword;
       user.resetPasswordToken = undefined;
       user.resetPasswordExpiresAt = undefined;
       await user.save();

       await sendResetSuccessEmail(user.email);

       return res.status(200).json({success: true, message: "Password Reset Successful."})

    } catch (error) {
        console.error(`Error resetting password`, error);
        return res.status(200).json({success: false, message: "Password Reset unsuccessful."})
    }
}

export const checkAuth = async (req,res) =>{
    try {
        const user = await User.findById(req.userId);
        if(!user){
            return res.status(400).json({success: false, message: "User not found."});
        }

        return res.status(200).json({success: true, user: {
            ...user._doc,
            password: undefined
        }});
        
    } catch (error) {
        console.error("Error in Checking Auth", error);
        return res.status(400).json({success: false, message: error.message});
    }
}
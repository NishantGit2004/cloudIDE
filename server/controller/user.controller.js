import { User } from "../model/user.model.js"
import jwt from 'jsonwebtoken'

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim()) return res.status(400).json({ message: "Name is required." });
        if (!email?.trim()) return res.status(400).json({ message: "Email is required." });
        if (!password?.trim()) return res.status(400).json({ message: "Password is required." });

        const existedUser = await User.findOne({ email });
        if (existedUser) return res.status(409).json({ message: "User already exists!" });

        const createdUser = await User.create({ name, email, password });

        const accessToken = createdUser.generateAccessToken();
        const refreshToken = createdUser.generateRefreshToken();

        createdUser.refreshToken = refreshToken;
        await createdUser.save();

        const user = await User.findById(createdUser._id).select("-password -refreshToken");

        // Set HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            user,
            accessToken,
            message: "User created successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email?.trim()) return res.status(400).json({ message: "Email is required" });
        if (!password?.trim()) return res.status(400).json({ message: "Password is required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) return res.status(401).json({ message: "Invalid email or password" });

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        const userInfo = await User.findById(user._id).select("-password -refreshToken");

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            user: userInfo,
            accessToken,
            message: "Login successful"
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = user.generateAccessToken();
    return res.status(200).json({ accessToken: newAccessToken });

  } catch (err) {
    return res.status(403).json({ message: 'Token verification failed' });
  }
}

export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(200).json({ message: "Already logged out" });

    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
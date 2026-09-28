const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Faculty } = require('../models/mysql');
const emailService = require('../services/emailService');
const { logger } = require('../services/loggerService');

const JWT_SECRET = process.env.JWT_SECRET || 'cse_agentic_erp_super_secure_jwt_secret_2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'cse_agentic_erp_refresh_secret_2025';
const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
};

// 1. Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      where: { email: cleanEmail },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Faculty, as: 'facultyProfile', required: false }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found in CSE records.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`[Auth] Successful login for: ${user.email} (${user.role})`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile
      }
    });
  } catch (error) {
    logger.error(`[Auth] Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during login authentication.'
    });
  }
};

// 2. Register (Admin provision or self-service)
exports.register = async (req, res) => {
  try {
    const { email, password, name, role, enrollment_no, year, semester, section, batch, designation, specialization } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, name, and role (admin/faculty/student).'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: cleanEmail,
      password: hashedPassword,
      name,
      role: role.toLowerCase()
    });

    let profile = null;

    if (user.role === 'student') {
      profile = await Student.create({
        userId: user.id,
        enrollment_no: enrollment_no || `0103CS${Date.now().toString().slice(-6)}`,
        name,
        email: cleanEmail,
        year: year || '3rd Year',
        semester: semester ? Number(semester) : 5,
        section: section || 'A',
        batch: batch || '2022-2026',
        status: 'Active'
      });
    } else if (user.role === 'faculty') {
      profile = await Faculty.create({
        userId: user.id,
        name,
        email: cleanEmail,
        designation: designation || 'Assistant Professor',
        specialization: specialization || 'Computer Science & Engineering'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully in CSE Department records.',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    logger.error(`[Auth] Register error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message
    });
  }
};

// 3. Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token revoked or mismatched.'
      });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    logger.error(`[Auth] Refresh error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing authentication token.'
    });
  }
};

// 4. Forgot Password (OTP via Brevo)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered CSE user found with this email address.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otp;
    user.otpExpiry = expiry;
    await user.save();

    // Send email using Brevo
    await emailService.sendOtpEmail(user.email, otp, user.name);

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to registered email address.',
      email: user.email
    });
  } catch (error) {
    logger.error(`[Auth] Forgot password error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request.'
    });
  }
};

// 5. Verify OTP & Reset Password
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP code, and new password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.otpCode || user.otpCode !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code provided.'
      });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    // Hash new password and clear OTP
    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpiry = null;
    user.refreshToken = null;
    await user.save();

    logger.info(`[Auth] Password successfully reset for: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You may now login.'
    });
  } catch (error) {
    logger.error(`[Auth] Verify OTP error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP.'
    });
  }
};

// 6. Get Current Authenticated User
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.update({ refreshToken: null }, { where: { id: req.user.id } });
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

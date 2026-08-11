const { User } = require("../../models/administration/userModel.js");
const Role = require("../../models/administration/roleModel.js");
require('dotenv').config()
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');

const {
  generatePasswordHash,
  comparePasswordHash,
} = require("../../utils/bcrypt.js");
const { generateAccessToken } = require("../../utils/jwt.js");
const internModel = require("../../models/administration/internModel.js");
const { Staff } = require("../../models/administration/staffModel.js");

// ✅ Register - User Signup
const signup = async (req, res, next) => {
  console.log("signup");
  try {
    const {
      name,
      email,
      phone,
      password,
      role
    } = req.body;

    console.log("req.body", req.body);


    // Validate input
    if (!password || !name || !phone || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the role by name
    const roleDoc = await Role.findOne({ _id: role });
    if (!roleDoc) {
      return res.status(400).json({
        message: "Invalid role. Role not found in system."
      });
    }

    const isExist = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (isExist) {
      return res.status(422).json({
        message: "User Already Exists"
      });
    }

    const hashedPassword = await generatePasswordHash(password);

    let isCreate = await User.create({
      name,
      email,
      phone,
      role: roleDoc._id, // Use role ObjectId instead of string
      password: hashedPassword,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Account has been created successfully"
    });
  } catch (error) {
    console.error("Error creating user:", error);
    next(error);
  }
};



// ✅ Combined Login - Universal Authentication for all user types
const login = async (req, res, next) => {
  try {
    // Extract email, password, and userType from request body
    const { email, password, role } = req.body;

    console.log("req.body", req.body);


    // Validate required fields
    if (!email || !password) {
      const error = {
        status: 400,
        message: "Invalid input data",
        fields: {
          body: req.body,
          required: { email, password },
        },
      };
      return next(error);
    }




    let user = null;
    let userData = null;
    let userTypeName = '';

    // Auto-detect user type across User, Staff, and Intern collections
    user = await User.findOne({ email, isActive: true }).populate('role', 'role');
    if (user) {
      userTypeName = 'Admin';
      userData = {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role?.role || 'Admin',
      };
    } else {
      user = await Staff.findOne({ email, isActive: true }).populate('role', 'role');
      if (user) {
        if (user.employmentStatus !== 'Active') {
          const error = {
            status: 403,
            message: "Login denied. Your employment status is not Active.",
          };
          return next(error);
        }
        userTypeName = 'Staff';
        userData = {
          id: user._id,
          name: user.fullName,
          role: user.role?.role || 'Staff',
          email: user.officialEmail,
          phone: user.staffPhoneNumber,
          branch: user.branch ? user.branch.toString() : "",
        };
      } else {
        // Query both personal email and officialEmail for interns
        user = await internModel.findOne({
          $or: [
            { email: email.toLowerCase() },
            { officialEmail: email.toLowerCase() }
          ],
          isActive: true
        });
        if (user) {
          if (user.courseStatus !== 'Ongoing') {
            const error = {
              status: 403,
              message: "Login denied. Your course status is not Ongoing.",
            };
            return next(error);
          }
          userTypeName = 'Intern';
          userData = {
            id: user._id,
            name: user.fullName,
            role: 'Intern',
            email: user.email,
            phone: user.internPhoneNumber,
            isActive: user.isActive,
          };
        }
      }
    }

    if (!user) {
      const error = {
        status: 401,
        message: `${userTypeName} does not exist`,
      };
      return next(error);
    }

    // Verify the password
    const validPassword = await comparePasswordHash(password, user.password);
    if (!validPassword) {
      const error = {
        status: 401,
        message: "Invalid password or Username",
      };
      return next(error);
    }

    // Generate an access token for the user
    const accessToken = generateAccessToken(user._id);

    // Respond with success message and token
    res.status(200).json({
      success: true,
      accessToken,
      userData,
      // userType: userType.toLowerCase(),
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    next(error); // Forward error to error-handling middleware
  }
};

module.exports = {
  login,
  signup
};

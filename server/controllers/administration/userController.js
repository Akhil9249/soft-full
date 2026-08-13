const { User } = require("../../models/administration/userModel.js");
const Role = require("../../models/administration/roleModel.js");
const mongoose = require("mongoose");

// Helper function to get user role name
const getUserRoleName = async (userId) => {
  try {
    const user = await User.findById(userId).populate('role', 'role');
    if (user && user.role) {
      return user.role.role;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

// ✅ Get All Users (helper)
const getAllusers = async (res) => {
  try {
    const adminRole = await Role.findOne({ role: { $regex: /^(admin|branch admin)$/i } });
    const superAdminRole = await Role.findOne({ role: { $regex: /^super admin$/i } });

    const excludeRoles = [];
    if (adminRole) excludeRoles.push(adminRole._id);
    if (superAdminRole) excludeRoles.push(superAdminRole._id);

    const users = await User.find({
      role: { $nin: excludeRoles },
      isActive: true,
      isDeleted: { $ne: true }
    }).populate('role', 'role');

    return users;
  } catch (error) {
    console.error("Error in getAllusers helper:", error);
    return [];
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = await getUserRoleName(userId);

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let users = null;
    const superAdminRole = await Role.findOne({ role: { $regex: /^super admin$/i } });
    const adminRole = await Role.findOne({ role: { $regex: /^(admin|branch admin)$/i } });

    if (userRole.toLowerCase() === "super admin") {
      // Super admin sees all users except super admins
      const excludeRoles = superAdminRole ? [superAdminRole._id] : [];
      users = await User.find({
        role: { $nin: excludeRoles },
        isDeleted: { $ne: true }
      }).populate('role', 'role');
    } else if (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "branch admin") {
      // Admin/Branch Admin sees all users except super admins and admins/branch admins
      const excludeRoles = [];
      if (superAdminRole) excludeRoles.push(superAdminRole._id);
      if (adminRole) excludeRoles.push(adminRole._id);

      users = await User.find({
        role: { $nin: excludeRoles },
        isDeleted: { $ne: true }
      }).populate('role', 'role');
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      users: users || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the user.",
      error: error.message,
    });
  }
};


const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Validate categoryId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    // Find the user and toggle isActive
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found.",
      });
    }

    user.isActive = !user.isActive; // Toggle isActive
    await user.save(); // Save the updated category

    const users = await getAllusers(res);
    if (!Array.isArray(users)) return;

    res.status(200).json({
      success: true,
      message: `User updated Successfully.`,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the user status.",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.userId; // Assuming extracted from auth middleware

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Find the user first
    let userData = await User.findById(userId);
    let userType = "User";

    if (!userData) {
      const { Staff } = require("../../models/administration/staffModel");
      userData = await Staff.findById(userId);
      userType = "Staff";
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = {
      name: userData?.name || userData?.fullName,
      email: userData?.email || userData?.officialEmail,
      phone: userData?.phone || userData?.staffPhoneNumber,
      image: userData?.image || userData?.photo,
      branch: userData?.branch || null,
      userType,
    };

    res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the user.",
      error: error.message,
    });
  }
};

// ✅ Update User (PUT)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, password, role, isActive } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID.",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check unique email and mobile if they are being updated to different values
    if (email && email.toLowerCase() !== user.email) {
      const emailExist = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
      if (emailExist) {
        return res.status(422).json({
          success: false,
          message: "Email already in use.",
        });
      }
      user.email = email.toLowerCase();
    }

    if (mobile && mobile !== user.mobile) {
      const mobileExist = await User.findOne({ mobile, isDeleted: { $ne: true } });
      if (mobileExist) {
        return res.status(422).json({
          success: false,
          message: "Mobile number already in use.",
        });
      }
      user.mobile = mobile;
    }

    if (name) user.name = name;

    if (password) {
      const { generatePasswordHash } = require("../../utils/bcrypt.js");
      user.password = await generatePasswordHash(password);
    }

    if (role) {
      const roleDoc = await Role.findOne({ _id: role });
      if (!roleDoc) {
        return res.status(400).json({
          success: false,
          message: "Invalid role.",
        });
      }
      user.role = roleDoc._id;
    }

    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the user.",
      error: error.message,
    });
  }
};

// ✅ Soft Delete User (DELETE)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID.",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false; // Disable logins immediately
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user.",
      error: error.message,
    });
  }
};

module.exports = {
  getUser,
  toggleUserStatus,
  getUserById,
  updateUser,
  deleteUser,
};

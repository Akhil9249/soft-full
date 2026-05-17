// Import models with error handling
let Staff, Role, User;

try {
  const staffModel = require("../models/administration/staffModel");
  Staff = staffModel.Staff || staffModel;
} catch (error) {
  console.error("Failed to load Staff model:", error);
}

try {
  Role = require("../models/administration/roleModel");
} catch (error) {
  console.error("Failed to load Role model:", error);
}

try {
  const userModel = require("../models/userModel");
  User = userModel.User || userModel;
} catch (error) {
  console.error("Failed to load User model:", error);
}

// Verify models are loaded
if (!Staff) {
  console.error("CRITICAL: Staff model not loaded - permission checks will fail");
}
if (!Role) {
  console.error("CRITICAL: Role model not loaded - permission checks will fail");
}
if (!User) {
  console.error("CRITICAL: User model not loaded - permission checks will fail");
}

/**
 * Middleware factory to check permissions based on resource and action
 * Usage: checkPermission('studentManagement', 'viewStudent')
 * 
 * @param {string} resource - The resource name (e.g., 'studentManagement', 'materialManagement')
 * @param {string} action - The action name (e.g., 'viewStudent', 'addMaterial')
 * @returns {Function} Express middleware function
 */
const checkPermission = (resource, action) => {
  console.log("resource====", resource);
  console.log("action====", action);
  
  // Early validation - fail fast if models aren't loaded
  if (!Staff || !Role) {
    console.error("CRITICAL: Models not loaded properly");
    return async (req, res, next) => {
      return res.status(500).json({
        message: "Server configuration error - Models not loaded",
      });
    };
  }
  
  return async (req, res, next) => {
    try {
      const { userId } = req;
      console.log("userId====", userId);

      if (!userId) {
        return res.status(401).json({
          message: "You are UnAuthorized - User ID not found",
        });
      }

      // Find user - try Staff first, then User
      let user = null;
      
      try {
        if (Staff && typeof Staff.findById === 'function') {
          user = await Staff.findById(userId);
        } else {
          console.error("ERROR: Staff model is not a Mongoose model. Staff type:", typeof Staff);
        }
      } catch (staffError) {
        console.error("Error finding Staff:", staffError);
      }
      
      if (!user) {
        try {
          if (User && typeof User.findById === 'function') {
            user = await User.findById(userId);
          } else {
            console.error("ERROR: User model is not a Mongoose model. User type:", typeof User);
          }
        } catch (userError) {
          console.error("Error finding User:", userError);
        }
      }

      if (!user) {
        return res.status(401).json({
          message: "You are UnAuthorized - User not found",
        });
      }

      // Get user's role
      let role = null;
      
      try {
        if (user.role && Role && typeof Role.findById === 'function') {
          // If role is ObjectId, find it
          if (typeof user.role === 'object' || (typeof user.role === 'string' && user.role.match(/^[0-9a-fA-F]{24}$/))) {
            role = await Role.findById(user.role);
          } else if (typeof user.role === 'string') {
            // If role is string (role name), find by role name
            role = await Role.findOne({ role: user.role });
          }
        } else {
          console.error("ERROR: Role model is not a Mongoose model. Role type:", typeof Role);
          console.error("user.role:", user.role);
        }
      } catch (roleError) {
        console.error("Error finding Role:", roleError);
      }

      if (!role) {
        return res.status(401).json({
          message: "Role not found",
        });
      }

      const permissions = role.permissions;

      if (!permissions) {
        return res.status(401).json({
          message: "Permissions not configured for this role",
        });
      }

      // Check if the resource exists in permissions
      if (!permissions[resource]) {
        return res.status(403).json({
          message: `Permission denied - Resource '${resource}' not found`,
        });
      }

      // Check if the action exists for the resource
      if (permissions[resource][action] === undefined || permissions[resource][action] === null) {
        return res.status(403).json({
          message: `Permission denied - Action '${action}' not found for resource '${resource}'`,
        });
      }

      // Check if permission is granted
      if (!permissions[resource][action]) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
        });
      }

      // Permission granted, proceed
      next();

    } catch (error) {
      console.error('Permission check error:', error);
      res.status(401).json({
        message: "You are UnAuthorized",
        error: error.message
      });
    }
  };
};

module.exports = {
    checkPermission
};

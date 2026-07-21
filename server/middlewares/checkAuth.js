const jwt = require("jsonwebtoken");

const checkAuth = (req, res, next) => {
  try {
    console.log("checkAuth");
    let token = null

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];


    } else {
      token = req.headers.authorization;
      console.log("token=", token);
    }

    console.log("token====>", token);


    if (!token)
      return res.status(401).json({
        message: "UnAuthorized",
      });

    const tokenValid = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.userId = tokenValid._id;

    next();

  } catch (error) {
    console.log("error====", error);
    res.status(401).json({
      message: "You are UnAuthorized",
    });
  }
};

module.exports = {
  checkAuth
};

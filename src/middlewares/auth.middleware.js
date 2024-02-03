import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Send Error if no Token is Provided
    if (token) {
      throw new ApiError(400, "User not Authorized");
    }

    // Verify Token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // In the decoded Token we have the _id inserted. Using that we will get the user details

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});

// export default verifyJWT;

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Generate Refresh and Access Token Function

const generateAccessAndRefreshToken = async (userId) => {
  try {
    // First Find the User
    const user = await User.findById(userId);

    // Generate the Tokens as required
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    // Put the new Refresh token in the Model
    user.refreshToken = refreshToken;
    // Save the new refresh Token in Db but without Validation
    await user.save({ validateBeforeSave: false });

    return { refreshToken: refreshToken, accessToken: accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Token."
    );
  }
};

// Generate Refresh Code on Session Expiry

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req?.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken != user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or used");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { refreshToken, accessToken } = generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

// Register User Controller

const registerUser = asyncHandler(async (req, res) => {
  // Get User Details from frontEnd
  // Validation - Non Empty
  // Check if User Exist : e.g using Username and Password
  // Check for Images and Check for Avatar
  // Upload them in Cloudinary and Avatar is Properly Uploaded check
  // Create User Object - Create entry in DB
  // Remove Password and Refresh Token field from Response
  // Check for User Creation
  // Return Response(res)

  // Step 1: Get the User Data from Body
  const { fullName, email, password, username } = req.body;
  // console.log(fullName, email, password, username);

  // Step 2: Check if any of the field is Empty

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }

  // Step 3: Check if User Already Exist

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or Email already exist");
  }

  // Step 4: Check for Avatar and Cover Images

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }

  // Step 5:  Upload the Files on Cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    // Check if Avatar is properly Uploaded Or not

    throw new ApiError(400, "Avatar file is required.");
  }

  //Step 6:  Create User in DB

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // This Line is Added because we haven't added any check for cover Image.
    email,
    password,
    username: username.toLowerCase(),
  });

  // Step 7: Check for User creation

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Step 8 : Send Response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

// Login User Controller

const loginUser = asyncHandler(async (req, res) => {
  // Get the User Data from req.body
  const { username, email, password } = req.body;

  // Check if either of the Username or email is present

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required.");
  }

  // Check if the user is present in the db

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  // if User is Present check if the Password matches or Not
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(
      401,
      "Invalid User Credentials : Password doesn't match"
    );
  }

  // Run the Generate Refresh Token and Access Token Function

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // In this point we don't have Refresh Token in the user object. So we will get the tokens from db so that we can send it to the User Afterward

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // Create Options Objects for Cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Send data to User
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully"
      )
    );
});

// Logout User Controller
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log(fullName, email, password, username);

  // Step 2: Check if any of the field is Empty

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }

  // Step 3: Check if User Already Exist

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or Email already exist");
  }

  // Step 4: Check for Avatar and Cover Images

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }

  // Step 5:  Upload the Files on Cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Check if Avatar is properly Uploaded Or not

  if (!avatar) {
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

export { registerUser };

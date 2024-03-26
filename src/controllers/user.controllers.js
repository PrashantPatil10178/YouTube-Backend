import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../db/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshtoken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong While Generating Refresh and Access Token",
      error
    );
  }
};

const registerUser = asyncHandler(async function (req, res) {
  // Steps to RegisterUser
  // Get User Details From FontEnd
  // validation - not empty
  // check if user already exists : username,email
  // check for images , check for avatar
  // upload them to cloudinary,avatar
  // Create User Object - create Entry in db
  // remove password and refresh token feild from response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  console.log("Email: ", email);
  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.find({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already existed");
  }

  //  const avatarLocalPath = req.files?.avatar[0]?.path;

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  console.log(avatarLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage1 = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Not found");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage1.url,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Resgisted Sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Get the data from the User
  // Check the data is correct or Not
  // Check if the user is registred or not
  // Match the data of the User
  // Redirection on sucessfull Login
  // Create a access token
  // Create a refesh token

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "UserName or Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Does Not Exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshtoken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshtoken, options)
    .json(
      new ApiResponse(
        200,
        200,
        {
          loggedInUser,
          accessToken,
          refreshtoken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: 1,
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
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refeshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request");
    }

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoded?._id);
    if (!user) {
      throw (new ApiError(401), "Invalid Refresh Token ");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw (new ApiError(401), "Invalid Refresh Token ");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshtoken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshtoken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshtoken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpass, newpass } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpass);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status((200).json(new ApiResponse(200, {}, "Password Changed ")));
});

const getUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    200,
    {
      user: req.user,
    },
    "This is a Current Logged in User"
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All Fields Are Required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated Sucessfuly"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatar = req.file?.path;
  if (!avatar) {
    throw new ApiError(400, "Avatar File is missing");
  }
  const avatarUpdate = await uploadOnCloudinary(avatar);
  if (!avatarUpdate.url) {
    throw new ApiError(400, "Error While Uploading On Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUpdate.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Sucessfully"));
});

const updateUsercoverImage = asyncHandler(async (req, res) => {
  const coverImage = req.file?.path;
  if (!coverImage) {
    throw new ApiError(400, "Avatar File is missing");
  }
  const coverImageUpdate = await uploadOnCloudinary(coverImage);
  if (!coverImageUpdate.url) {
    throw new ApiError(400, "Error While Uploading On Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: coverImageUpdate.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage Updated Sucessfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is Missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
          },
        },
      },
    },
  ]);
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refeshAccessToken,
  getUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverImage,
};

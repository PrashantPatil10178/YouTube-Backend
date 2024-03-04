import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async function (req, res) {
  return res.status(200).json({
    message: "ok",
    Backend: "This is a Test",
  });
});

export { registerUser };

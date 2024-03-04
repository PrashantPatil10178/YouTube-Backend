import { asyncHandler } from "../utils/asyncHandler.js";

asyncHandler(async function (req, res) {
  res.status(200).json({
    message: "ok",
  });
});

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    console.log("File is uploaded on Cloudinary" + response);
    return response;
  } catch (error) {
    FileSystem.unlinkSync(localPath);
    return null;
  }
};

export { uploadOnCloudinary };

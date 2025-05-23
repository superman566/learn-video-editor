// Controllers
const User = require("./controllers/user");
const Video = require("./controllers/Video");

module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("post", "/api/login", User.logUserIn);

  // Log a user out
  server.route("delete", "/api/logout", User.logUserOut);

  // Send user info
  server.route("get", "/api/user", User.sendUserInfo);

  // Update user info
  server.route("put", "/api/user", User.updateUser);

  // ------------------------------------------------ //
  // ************ VIDEO ROUTES ************* //
  // ------------------------------------------------ //
  server.route("get", "/api/videos", Video.getVideos);

  server.route("post", "/api/upload-video", Video.uploadVideo);

  server.route("get", "/get-video-asset", Video.getVideoAsset);

  server.route("patch", "/api/video/extract-audio", Video.extractAudio);
};

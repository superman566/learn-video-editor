const fs = require("node:fs");

const usersPath = "./data/users";
const sessionsPath = "./data/sessions";
const videosPath = "./data/videos";

class DB {
  constructor() {
    /*
     A sample object in this user's array would look like:
     { id: 1, name: "Liam Brown", username: "liam23", password: "string" }
    */
    this.users = JSON.parse(fs.readFileSync(usersPath, "utf8"));

    /*
     A sample object in this sessions array would look like:
     { userId: 1, token: 23423423 }
    */
    this.sessions = JSON.parse(fs.readFileSync(sessionsPath, "utf8"));

    /*
     A sample object in this video array would look like:
     { userId: 1, token: 23423423 }
    */
    this.videos = JSON.parse(fs.readFileSync(videosPath, "utf8"));
  }

  update() {
    this.users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    this.sessions = JSON.parse(fs.readFileSync(sessionsPath, "utf8"));
    this.videos = JSON.parse(fs.readFileSync(videosPath, "utf8"));
  }

  save() {
    fs.writeFileSync(usersPath, JSON.stringify(this.users));
    fs.writeFileSync(sessionsPath, JSON.stringify(this.sessions));
    fs.writeFileSync(videosPath, JSON.stringify(this.videos));
  }
}

const db = new DB();

module.exports = db;

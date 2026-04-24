const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// =========================
// LOG FILE SETUP
// =========================
const logDir = path.join(__dirname, "../logs");

// create logs folder if not exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// log file stream
const accessLogStream = fs.createWriteStream(
  path.join(logDir, "access.log"),
  { flags: "a" }
);

// =========================
// MORGAN FORMAT
// =========================
const devLogger = morgan("dev"); // console log (clean)

const fileLogger = morgan("combined", {
  stream: accessLogStream,
});

// =========================
// EXPORT
// =========================
module.exports = {
  devLogger,
  fileLogger,
};
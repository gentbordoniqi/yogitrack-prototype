const express = require("express");
const path = require("path");
const { connectDB } = require("./config/mongodbconn.cjs");

const app = express();

// Serve static files from the public dir
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());


app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
app.use("/api/Class", require("./routes/classScheduleRoutes.cjs"));
//app.use("/api/package", require("./routes/packageRoutes.cjs"));
app.use("/api/customer", require("./routes/customerRoutes.cjs"));



// Start the web server
const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
  console.log('Open http://localhost:8080/index.html in your browser to view the app.');
});

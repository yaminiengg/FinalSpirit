/*

require("dotenv").config()

const express = require("express")
const cors = require("cors")

const paymentRoutes = require("./routes/payment")
const feedbackRoutes = require("./routes/feedback");

const authRoutes = require("./routes/auth")
const notesRoutes = require("./routes/notes")


const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/payment",paymentRoutes)
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes)
app.use("/api/notes",notesRoutes)
app.use("/uploads", express.static("uploads"))



app.listen(5000,()=>{

console.log("Server running on port 5000")

})

*/

require("dotenv").config()

const express = require("express")
const cors = require("cors")

const PORT = process.env.PORT || 5000


const paymentRoutes = require("./routes/payment")
const feedbackRoutes = require("./routes/feedback")
const authRoutes = require("./routes/auth")
const notesRoutes = require("./routes/notes")

const app = express()

app.use(cors())
app.use(express.json())

// ✅ PUBLIC
app.use("/api/auth", authRoutes)

// ✅ PROTECTED (handled inside routes)
app.use("/api/payment", paymentRoutes)
app.use("/api/feedback", feedbackRoutes)
app.use("/api/notes", notesRoutes)

app.use("/uploads", express.static("uploads"))

app.listen(5000, () => {
  console.log("🚀 Server started on port 5000");
});
/*
app.listen(PORT, ()=>{
  console.log("Server running")
})
*/

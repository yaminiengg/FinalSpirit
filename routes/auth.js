const express = require("express")
const router = express.Router()
const db = require("../config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const otpStore = {}


const nodemailer = require("nodemailer")
require("dotenv").config

const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}
})

router.post("/send-otp",(req,res)=>{

const { email } = req.body

if(!email){
return res.json({success:false,message:"Email required"})
}

// check user exists
db.query("SELECT * FROM users WHERE email=?",[email],(err,result)=>{

if(result.length === 0){
return res.json({success:false,message:"Email not registered"})
}

// ✅ generate OTP
const otp = Math.floor(100000 + Math.random()*900000)

// ✅ set expiry (2 minutes)
const expiry = Date.now() + 2 * 60 * 1000

// ✅ store OTP + expiry
otpStore[email] = {
otp: otp,
expiry: expiry
}

// ✅ send mail
transporter.sendMail({
from: process.env.EMAIL_USER,
to: email,
subject: "Final Spirit OTP",
text: "Your OTP is: " + otp
}, (err)=>{

if(err){
console.log(err)
return res.json({success:false,message:"Email failed"})
}

res.json({success:true,message:"OTP sent (valid for 2 mins)"})

})

})

})

/*
router.post("/login",(req,res)=>{

const { email, password } = req.body

const sql = "SELECT * FROM users WHERE email=?"

db.query(sql,[email],(err,result)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

if(result.length === 0){
return res.json({success:false, message:"User not found"})
}

const user = result[0]

// ✅ Compare hashed password
bcrypt.compare(password, user.password, (err, isMatch)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

if(!isMatch){
return res.json({success:false, message:"Invalid password"})
}

// ✅ LOGIN SUCCESS
res.json({
success:true,
user:{
id: user.id,
email: user.email
}
})

})

})

})
*/

router.post("/login",(req,res)=>{

const { email, password } = req.body

const sql = "SELECT * FROM users WHERE email=?"

db.query(sql,[email],(err,result)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

if(result.length === 0){
return res.json({success:false, message:"User not found"})
}

const user = result[0]

// ✅ Compare hashed password
bcrypt.compare(password, user.password, (err, isMatch)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

if(!isMatch){
return res.json({success:false, message:"Invalid password"})
}

// ✅ 🔥 GENERATE TOKEN
const token = jwt.sign(
{ id: user.id },
"secretkey",
{ expiresIn: "1d" }
)

// ✅ 🔥 STORE TOKEN IN DB (this logs out old device)
db.query(
"UPDATE users SET active_token=? WHERE id=?",
[token, user.id],
(err)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

// ✅ LOGIN SUCCESS
res.json({
success:true,
token: token,
user:{
id: user.id,
email: user.email
}
})

})

})

})

})





router.post("/signup", async (req,res)=>{

const { name, email, password } = req.body

// ✅ VALIDATION
if(!name || !email || !password){
return res.status(400).json({
success:false,
message:"All fields are required ❌"
})
}

// ✅ EMAIL FORMAT CHECK (basic)
if(!email.includes("@")){
return res.status(400).json({
success:false,
message:"Invalid email ❌"
})
}

// ✅ CHECK EXISTING EMAIL
const checkSql = "SELECT * FROM users WHERE email=?"

db.query(checkSql,[email], async (err,result)=>{

if(result.length > 0){
return res.status(400).json({
success:false,
message:"Email already exists ❌"
})
}

// ✅ HASH PASSWORD
const hashedPassword = await bcrypt.hash(password,10)

// ✅ INSERT USER
const sql = `
INSERT INTO users(name,email,password)
VALUES(?,?,?)
`

db.query(sql,[name,email,hashedPassword],(err)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

res.json({
success:true,
message:"Signup successful ✅"
})

})

})

})




router.post("/reset-password", async (req,res)=>{

const { email, password } = req.body

if(!email || !password){
return res.status(400).json({
success:false,
message:"Missing fields"
})
}

// check user exists
const checkSql = "SELECT * FROM users WHERE email=?"

db.query(checkSql,[email], async (err,result)=>{

if(result.length === 0){
return res.json({
success:false,
message:"User not found ❌"
})
}

// hash new password
const hashedPassword = await bcrypt.hash(password,10)

// update password
const sql = "UPDATE users SET password=? WHERE email=?"

db.query(sql,[hashedPassword,email],(err)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

res.json({
success:true,
message:"Password updated"
})

})

})

})

router.post("/verify-otp",(req,res)=>{

const { email, otp, password } = req.body

const data = otpStore[email]

if(!data){
return res.json({success:false,message:"No OTP found ❌"})
}

// ✅ check expiry
if(Date.now() > data.expiry){
delete otpStore[email]
return res.json({success:false,message:"OTP expired ⏳"})
}

// ✅ check OTP
if(data.otp != otp){
return res.json({success:false,message:"Invalid OTP ❌"})
}

// ✅ hash password
const bcrypt = require("bcrypt")

bcrypt.hash(password,10,(err,hash)=>{

db.query(
"UPDATE users SET password=? WHERE email=?",
[hash,email],
(err)=>{

if(err){
console.log(err)
return res.status(500).send("error")
}

// ✅ delete OTP after use
delete otpStore[email]

res.json({success:true,message:"Password reset successful ✅"})

})

})

})


router.post("/logout",(req,res)=>{

const token = req.headers.authorization

if(!token){
return res.status(400).json({message:"No token"})
}

try{

const decoded = jwt.verify(token,"secretkey")

db.query(
"UPDATE users SET active_token=NULL WHERE id=?",
[decoded.id],
(err)=>{

if(err){
return res.status(500).send("error")
}

res.json({success:true,message:"Logged out"})
})

}catch(err){
return res.status(401).json({message:"Invalid token"})
}

})



module.exports = router
const jwt = require("jsonwebtoken")
const db = require("../config/db")

const authMiddleware = (req,res,next)=>{

let token = req.headers.authorization

if(!token){
return res.status(401).json({message:"No token"})
}

// ✅ FIX: remove Bearer
if(token.startsWith("Bearer ")){
token = token.slice(7, token.length)
}

try{

const decoded = jwt.verify(token,"secretkey")

db.query(
"SELECT active_token FROM users WHERE id=?",
[decoded.id],
(err,result)=>{

if(err || result.length === 0){
return res.status(401).json({message:"User not found"})
}

if(result[0].active_token !== token){
return res.status(401).json({
message:"Logged out! Another device logged in."
})
}

req.user = decoded
next()

})

}catch(err){
return res.status(401).json({message:"Invalid token"})
}

}

module.exports = authMiddleware;
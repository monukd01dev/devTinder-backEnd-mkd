
function adminAuth (req,res,next){
    try {
        const authToken = "farzi-auth-token";
        const isAuthorised = authToken.includes('auth')

        if(!isAuthorised){
            throw new Error("Admin credentials doesn't match please try again")
        }

        return next();

    } catch (error) {

        console.log(`[ADMIN AUTH LOG] : admin credentials doesn't match`)

        return res.status(401).json({
            "success" : "false",
            "data":{},
            "error": error.message,
        })
    }
}

module.exports = {
    adminAuth
}
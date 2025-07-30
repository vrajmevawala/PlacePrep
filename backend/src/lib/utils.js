import jwt from 'jsonwebtoken'

export const generateToken = (userID, role, res) => {
    const token = jwt.sign({ userID, role }, process.env.JWT_SECRET, { 
        expiresIn: '7d' 
    });

    res.cookie("jwt",token,{
        maxAge: 7 * 24 * 60 * 60 * 1000, //milisecond
        httpOnly: true, // to prevent from XSS attacks cross-site scripting attack
        sameSite: "strict", // CSRF attacks cross-site forgery attack
        secure: process.env.NODE_ENV !== "development"
    });
    return token;
};

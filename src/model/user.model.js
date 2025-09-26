import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    name:String,
    email:String,
    phone:{type:Number},
    password:String,
    address:String,
    refreshToken:String,
    role:{type:String,default:'User'},
    orderHistory:[
        {
            items:{
                name:String,
                price:Number,
                imgUrl:String
            },
            totalAmt:Number,
            billDate:String
        }
    ]
})

userSchema.pre('save', function (next) {
    if (!this.isModified("password")) return next();

    const user = this;
    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});


userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
    const user = this;    
    return await bcrypt.compare(enteredPassword,user.password);
} 

userSchema.methods.generateAccessToken= async function(){
    
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
            name: this.name
        },
        process.env.ACCESS_TOKEN_KEY,
        {
            expiresIn:process.env.TOKEN_EXPIRY    
        }
    );    
}

userSchema.methods.generateRefreshToken= async function(){
    return jwt.sign(
        {
            userId:this._id
        },
        process.env.REFRESH_TOKEN_KEY,
        {
            expiresIn:process.env.TOKEN_EXPIRY    
        }
    )    
}

const User = new model('User',userSchema);
export default User;
import mongoose, { Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";

//we dont write id in schema becuz mongodb generates a unique id of user itself (in BSON data)

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //makes it searchable in optimised way
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    password: {
      type: String,
      required: [true, "password is required"], //custom msg
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//middleware : given by mongoose (refer documentation)

//arrow fxn is not used becuz .this does not work with arrow fxns
//pre hook runs just before your data gets saved (used for passwrd encryption) becuz direct encryption is not possible
userSchema.pre("save", async function() {
  //save is an event , similarly there are many other events like : remove , updateOne , deleteOne , validate and init

  //the problem is everytime someone saves anything like avatar and click save button ,password will be encrypted everytime due to prehook and we want encryption only happens when password field modifies 
  if (!this.isModified("password")) {
    return;
  }
  //if modified then do encryption
  this.password = await bcrypt.hash(this.password, 10);//10 salting rounds
  ;
});

//method :mongoose gives us methods ,custom functions that you define on a schema and that become available on individual documents (instances of that model).

//we have made a property of isPasswordCorrect
userSchema.methods.isPasswordCorrect = async function(password) {
  //bcrypt also has method to check the password

  //this returns true or false
  return await bcrypt.compare(password, this.password);
};

//this is fast so no need of async
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(//payload
    {
      //payload key : taken from database
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },//secret
    process.env.ACCESS_TOKEN_SECRET,
    {//expiry
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      //it refresh regularly so it contains less data
      _id: this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
//this User can directly contact with db becuz its made using mongoose




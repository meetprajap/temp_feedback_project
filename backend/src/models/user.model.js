import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const UserSchema = new Schema(
    {
  
    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
 
 
  password: {
    type: String,
    required: [true, 'Password is required']
  },
 
  refreshToken: {
    type: String
  },

 
  
  walletAddress: {
    type: String,
    default: null,
    lowercase: true
  },
  blockchainTxHash: {
    type: String,
    default: null
  },
  blockchainBlockNumber: {
    type: Number,
    default: null
  },
  feedbackSubmissions: [{
    courseId: Number,
    courseName: String,
    teacherId: String,
    teaching: Boolean,
    communication: Boolean,
    fairness: Boolean,
    engagement: Boolean,
    submittedAt: Date
  }]
},
{timestamps:true});//this is give create at and updated at

//hook (that pre hook run just before the data save in database)
UserSchema.pre('save', async function (next) {
 //here we have to used the
//  nommal fun bcz if we used arrow fun than they not provide the this ref that we need here

    if (!this.isModified('password')) return next(); 
   
this.password = await bcrypt.hash(this.password,8);
next();
})

UserSchema.methods.isPasswordCorrect = async function(password) {//method that compare that user password and data base password is same or not
  return await bcrypt.compare(password, this.password);
};



// Generate Access Token method
UserSchema.methods.generateAccessToken = function() {
  try {
    const payload = {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      branch: this.branch,
      department: this.department,
      role: this.role
    };
    
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const expiry = process.env.ACCESS_TOKEN_EXPIRY;
    
    if (!secret) {
      console.error("❌ ACCESS_TOKEN_SECRET is not set!");
      throw new Error("ACCESS_TOKEN_SECRET is not configured");
    }
    
    console.log(`🔑 Generating Access Token:`);
    console.log(`   User ID: ${this._id}`);
    console.log(`   Secret length: ${secret.length}`);
    console.log(`   Expiry: ${expiry}`);
    
    const token = jwt.sign(payload, secret, { expiresIn: expiry });
    
    console.log(`✅ Token generated successfully (length: ${token.length})`);
    
    return token;
  } catch (error) {
    console.error(`❌ Error generating access token: ${error.message}`);
    throw error;
  }
};
// Generate Refresh Token method
UserSchema.methods.generateRefreshToken = function() {
  try {
    const payload = {
      _id: this._id
    };
    
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const expiry = process.env.REFRESH_TOKEN_EXPIRY;
    
    if (!secret) {
      console.error("❌ REFRESH_TOKEN_SECRET is not set!");
      throw new Error("REFRESH_TOKEN_SECRET is not configured");
    }
    
    return jwt.sign(payload, secret, { expiresIn: expiry });
  } catch (error) {
    console.error(`❌ Error generating refresh token: ${error.message}`);
    throw error;
  }
};

export const User = mongoose.model("User",UserSchema)
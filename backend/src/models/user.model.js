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
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  refreshToken: {
    type: String
  },
  branch: {
    type: String,
    enum: ['CE', 'IT', 'EC', 'ME', 'Civil'],
    required: false
  },
  department: {
    type: String,
    enum: ['CE', 'IT', 'EC', 'ME', 'Civil'],
    required: false
  },
  feedbackSubmissions: [
    {
      courseId: {
        type: Number,
        required: true
      },
      courseName: {
        type: String
      },
      teaching: {
        type: Boolean,
        default: false
      },
      communication: {
        type: Boolean,
        default: false
      },
      fairness: {
        type: Boolean,
        default: false
      },
      engagement: {
        type: Boolean,
        default: false
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      blockchainTxHash: {
        type: String,
        default: null
      },
      blockchainBlockNumber: {
        type: Number,
        default: null
      },
      blockchainFinalScore: {
        type: Number,
        default: null
      }
    }
  ],
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
  }
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
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      branch: this.branch,
      department: this.department,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};
// Generate Refresh Token method
UserSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );

};

export const User = mongoose.model("User",UserSchema)
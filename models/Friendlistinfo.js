import mongoose, {Schema} from "mongoose";

const STATUS_ENUM = ['pending', 'accepted', 'rejected', 'cancelled'];

const FriendlistinfoSchema = new mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'Userinfo',
        required: true
    },
    // Reference to the User who is the RECIPIENT of the request
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'Userinfo',
        required: true
    },
    // The current status of the request
    status: {
        type: String,
        enum: STATUS_ENUM, // Must be one of the defined values
        default: 'pending',
        required: true
    },
    blockstatus: {
       type: Boolean, 
       default: false,
       required: true    
    },
    voicecallaccess: {
       type: Boolean, 
       default: true,
       required: true    
    },
    videocallaccess: {
       type: Boolean, 
       default: true,
       required: true    
    },
    chataccess: {
       type: Boolean, 
       default: true,
       required: true    
    },
     galleryaccess: {
       type: Boolean, 
       default: true,
       required: true    
    },
    friendlistaccess: {
       type: Boolean, 
       default: true,
       required: true    
    },
    reelaccess: {
       type: Boolean, 
       default: true,
       required: true    
    },    
},{timestamps: true});
    
export default mongoose.model("FriendRequest", FriendlistinfoSchema);
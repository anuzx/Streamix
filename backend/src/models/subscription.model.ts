import mongoose, { Schema } from "mongoose";

//to count a channel's subscribers , select the documents with that specific channel

//to know which channels have been subscribed by a user then just select that user and fetch the channel list



const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //one to whom subscribing
        ref: "User"
    }
}, { timestamps: true });

export const Subscription = mongoose.model("Subscription" , subscriptionSchema)

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: String,//cloudinary url (cloudinary gives info which also contains duration for vids)
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);



videoSchema.plugin(mongooseAggregatePaginate)//It helps you break large sets of data into smaller pages when using MongoDB aggregation queries.
//we can now easily fetch videos page-by-page instead of loading everything at once.

export const Video = mongoose.model("Video", videoSchema);

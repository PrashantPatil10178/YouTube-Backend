import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  subscriber: {
    typeof: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);

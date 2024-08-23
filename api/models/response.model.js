import mongoose from "mongoose";

// Define the user response schema, referencing the questionId
const UserResponseSchema = new mongoose.Schema({
    idquestionset: { type: String, required: true }, // idquestionset from questionPickemSchema
    questionIndex: { type: String, required: true }, // question field from questionSchema
    selectedOption: { type: String } // This should match the teamname or playername in choiceSchema
}, { _id: false });

// Define the overall response schema
const ResponseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userresponse: [UserResponseSchema]
});

// Create the response model
const Response = mongoose.model('Response', ResponseSchema, "useresponse");

// Export the models
export default Response;

import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["multiple-choice", "true-false", "essay"],
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [
        {
            type: String
        }
    ],
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed, // Accepts string or number
        required: true,
        validate: {
            validator: function (value: any, props: any) {
                const type = props && props.parent && props.parent.type;
                if (type === "essay") {
                    return value === "";
                }
                if (type === "true-false" || type === "multiple-choice") {
                    return typeof value === "number";
                }
                return true;
            },
            message: function (props: any) {
                const type = props && props.parent && props.parent.type;
                if (type === "essay") {
                    return "Essay questions must have correctAnswer as an empty string.";
                }
                if (type === "true-false" || type === "multiple-choice") {
                    return "Multiple-choice and true-false questions must have correctAnswer as a number (index).";
                }
                return "Invalid correctAnswer value.";
            }
        }
    }
});

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    timer: {
        type: Number,
        required: true
    },
    questions: [questionSchema]
}, {
    timestamps: true
})

export const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema)
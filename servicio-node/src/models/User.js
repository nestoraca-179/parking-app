const mongoose = require('mongoose');

const ROLES = ['ADMIN', 'OPERATOR'];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ROLES },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: {
      transform: (document, result) => {
        result.id = result._id.toString();
        delete result._id;
        delete result.__v;
        delete result.passwordHash;
        return result;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES };

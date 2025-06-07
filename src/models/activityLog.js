const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: ['upload', 'download', 'delete', 'share'],
    required: true
  },
  filename: { type: String, required: true },
  size: { type: Number, default: 0 }, // in bytes
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

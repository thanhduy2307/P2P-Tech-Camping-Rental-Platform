const mongoose = require('mongoose');

const inspectorTaskSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'completed', 'cancelled'],
    default: 'assigned'
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  distance: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('InspectorTask', inspectorTaskSchema);

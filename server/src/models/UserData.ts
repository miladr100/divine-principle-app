import mongoose, { Schema } from 'mongoose';

const UserDataSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  lastLocation: {
    sectionId: String,
    paragraphId: String,
    updatedAt: Date
  },
  completedSectionIds: { type: [String], default: [] },
  highlights: [{
    id: String, sectionId: String, paragraphId: String, selectedText: String,
    startOffset: Number, endOffset: Number, color: { type:String, default:'#ff72b6' }, createdAt: Date
  }],
  notes: [{ id:String, sectionId:String, paragraphId:String, selectedText:String, noteText:String, createdAt:Date }],
  bookmarks: [{ id:String, sectionId:String, paragraphId:String, selectedText:String, categoryIds:[String], createdAt:Date }],
  categories: [{ id:String, name:String }],
  settings: {
    fontSize:Number, speechRate:Number, autoContinueSection:Boolean,
    showEditorialColors:Boolean, readingDepth:String, darkMode:Boolean
  }
}, { timestamps:true });

export const UserData = mongoose.model('UserData', UserDataSchema);

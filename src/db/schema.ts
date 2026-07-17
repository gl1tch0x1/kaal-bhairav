import mongoose, { Schema } from "mongoose";

export const roleEnum = ["admin", "analyst", "viewer"];
export const investigationStatusEnum = ["active", "pending", "closed", "archived"];
export const severityEnum = ["critical", "high", "medium", "low", "info"];
export const targetTypeEnum = ["person", "organization", "domain", "ip", "phone", "email", "social"];

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  role: { type: String, enum: roleEnum, default: "analyst" },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

const InvestigationSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: investigationStatusEnum, default: "active" },
  severity: { type: String, enum: severityEnum, default: "medium" },
  targetType: { type: String, enum: targetTypeEnum, default: "person" },
  targetValue: { type: String },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
  metadata: { type: Schema.Types.Mixed },
  closedAt: { type: Date },
}, { timestamps: true });

const SearchHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  investigationId: { type: Schema.Types.ObjectId, ref: 'Investigation' },
  query: { type: String, required: true },
  queryType: { type: String },
  results: { type: Schema.Types.Mixed },
  resultCount: { type: Number, default: 0 },
}, { timestamps: true });

const TargetSchema = new Schema({
  investigationId: { type: Schema.Types.ObjectId, ref: 'Investigation' },
  type: { type: String, enum: targetTypeEnum, required: true },
  value: { type: String, required: true },
  label: { type: String },
  notes: { type: String },
  metadata: { type: Schema.Types.Mixed },
  tags: [{ type: String }],
  risk: { type: String, enum: severityEnum, default: "info" },
  lastSeen: { type: Date },
}, { timestamps: true });

const AlertSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  investigationId: { type: Schema.Types.ObjectId, ref: 'Investigation' },
  title: { type: String, required: true },
  message: { type: String },
  severity: { type: String, enum: severityEnum, default: "medium" },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const ActivityLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
}, { timestamps: true });

const FeedItemSchema = new Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  severity: { type: String, enum: severityEnum, default: "medium" },
  source: { type: String, required: true },
  time: { type: Date, default: Date.now },
  tags: [{ type: String }],
  iocs: [{ type: String }],
});

const ReportSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  date: { type: String, required: true },
  pages: { type: Number, required: true },
  status: { type: String, required: true },
  author: { type: String, required: true },
  severity: { type: String, enum: severityEnum, default: "medium" },
});

const DataSourceSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  latency: { type: String, required: true },
  lastChecked: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  docs: { type: String, required: true },
});

const NetworkNodeSchema = new Schema({
  nodeId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  label: { type: String, required: true },
  ip: { type: String },
  risk: { type: String, enum: severityEnum, default: "info" },
});

const NetworkLinkSchema = new Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
});

const OSINTResultSchema = new Schema({
  query: { type: String, required: true },
  queryType: { type: String, required: true },
  title: { type: String, required: true },
  snippet: { type: String, required: true },
  url: { type: String, required: true },
  source: { type: String, required: true },
  date: { type: String },
  riskScore: { type: Number, required: true },
  tags: [{ type: String }],
});

// Text index for robust search performance
OSINTResultSchema.index({ query: "text", title: "text", snippet: "text" });

// Relational and performance indexes
InvestigationSchema.index({ createdAt: -1 });
InvestigationSchema.index({ createdBy: 1 });
AlertSchema.index({ userId: 1, isRead: 1 });
TargetSchema.index({ investigationId: 1 });
SearchHistorySchema.index({ userId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

const CameraFeedSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true },
  latency: { type: Number, required: true },
  fps: { type: Number, required: true },
  uptime: { type: String, required: true },
});

const SurveillanceEventSchema = new Schema({
  cameraId: { type: Schema.Types.ObjectId, ref: 'CameraFeed' },
  type: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: severityEnum, default: "info" },
  timestamp: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Investigation = mongoose.models.Investigation || mongoose.model("Investigation", InvestigationSchema);
export const SearchHistory = mongoose.models.SearchHistory || mongoose.model("SearchHistory", SearchHistorySchema);
export const Target = mongoose.models.Target || mongoose.model("Target", TargetSchema);
export const Alert = mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
export const FeedItem = mongoose.models.FeedItem || mongoose.model("FeedItem", FeedItemSchema);
export const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);
export const DataSource = mongoose.models.DataSource || mongoose.model("DataSource", DataSourceSchema);
export const NetworkNode = mongoose.models.NetworkNode || mongoose.model("NetworkNode", NetworkNodeSchema);
export const NetworkLink = mongoose.models.NetworkLink || mongoose.model("NetworkLink", NetworkLinkSchema);
export const OSINTResult = mongoose.models.OSINTResult || mongoose.model("OSINTResult", OSINTResultSchema);
export const CameraFeed = mongoose.models.CameraFeed || mongoose.model("CameraFeed", CameraFeedSchema);
export const SurveillanceEvent = mongoose.models.SurveillanceEvent || mongoose.model("SurveillanceEvent", SurveillanceEventSchema);

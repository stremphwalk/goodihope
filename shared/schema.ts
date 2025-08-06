import { pgTable, text, serial, integer, boolean, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // UUID for Supabase auth integration
  email: text("email").notNull().unique(),
  name: text("name"), // User's display name
  customIdentifier: text("custom_identifier").unique(), // 4 letters + 2 numbers format
  emailVerified: boolean("email_verified").default(false),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for user sessions
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dotPhrases = pgTable("dot_phrases", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  trigger: text("trigger").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  category: text("category").default("general"),
  shareCode: text("share_code").unique(),
  isPublic: boolean("is_public").default(false),
  sharedAt: timestamp("shared_at"),
  importCount: integer("import_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rosNotes = pgTable("ros_notes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  patientName: text("patient_name").notNull(),
  patientDob: text("patient_dob").notNull(),
  patientMrn: text("patient_mrn").notNull(),
  selections: jsonb("selections").notNull(),
  medications: jsonb("medications").notNull().default('{"homeMedications":[],"hospitalMedications":[]}'),
  generatedNote: text("generated_note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for user presets
export const userPresets = pgTable("user_presets", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull().unique(),  // Unique titles per user (enforced in API)
  isFavorite: boolean("is_favorite").default(false),
  symptoms: jsonb("symptoms").notNull(),  // JSONB for symptoms object
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Templates table
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  specialty: text("specialty"),
  content: jsonb("content").notNull(),
  isPublic: boolean("is_public").default(false),
  version: integer("version").default(1),
  parentTemplateId: integer("parent_template_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  compatibleNoteTypes: jsonb("compatible_note_types"),
  compatibleSubtypes: jsonb("compatible_subtypes"),
  sectionDefaults: jsonb("section_defaults"),
  lastUsed: timestamp("last_used"),
  isFavorite: boolean("is_favorite").default(false),
});

// Template usage table
export const templateUsage = pgTable("template_usage", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
  patientContext: jsonb("patient_context"),
});

// Team Groups tables
export const teamGroups = pgTable("team_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id).notNull(),
  inviteCode: text("invite_code").notNull().unique(), // 6-character invite code
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 7 days
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => teamGroups.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // "creator" or "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const groupTodos = pgTable("group_todos", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => teamGroups.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id).notNull(),
  status: text("status").default("todo").notNull(), // 'todo' | 'in_progress' | 'review' | 'done'
  position: integer("position").default(0).notNull(), // Position within the status column for ordering
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  completed: boolean("completed").default(false), // Keep for backward compatibility during migration
  completedByUserId: uuid("completed_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const groupEvents = pgTable("group_events", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => teamGroups.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User lab settings table for cross-platform preferences
export const userLabSettings = pgTable("user_lab_settings", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  settings: jsonb("settings").notNull(), // Lab settings JSON object
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionToken: true,
  expiresAt: true,
});

export const insertDotPhraseSchema = createInsertSchema(dotPhrases).pick({
  userId: true,
  trigger: true,
  content: true,
  description: true,
  category: true,
});

// New insert schema for presets
export const insertUserPresetSchema = createInsertSchema(userPresets).pick({
  userId: true,
  title: true,
  isFavorite: true,
  symptoms: true,
});

// Templates insert schema
export const insertTemplateSchema = createInsertSchema(templates).pick({
  userId: true,
  name: true,
  description: true,
  category: true,
  specialty: true,
  content: true,
  isPublic: true,
  compatibleNoteTypes: true,
  compatibleSubtypes: true,
  sectionDefaults: true,
  isFavorite: true,
});

// Team Groups insert schemas
export const insertTeamGroupSchema = createInsertSchema(teamGroups).pick({
  name: true,
  description: true,
  createdByUserId: true,
  inviteCode: true,
  expiresAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export const insertGroupTodoSchema = createInsertSchema(groupTodos).pick({
  groupId: true,
  title: true,
  description: true,
  createdByUserId: true,
});

export const insertGroupEventSchema = createInsertSchema(groupEvents).pick({
  groupId: true,
  title: true,
  description: true,
  eventDate: true,
  createdByUserId: true,
});

export const insertUserLabSettingsSchema = createInsertSchema(userLabSettings).pick({
  userId: true,
  settings: true,
});

export const insertRosNoteSchema = createInsertSchema(rosNotes).pick({
  userId: true,
  patientName: true,
  patientDob: true,
  patientMrn: true,
  selections: true,
  medications: true,
  generatedNote: true,
});

// Medication types for ordering by importance
export const medicationCategories = {
  anticoagulants: ['warfarin', 'coumadin', 'rivaroxaban', 'xarelto', 'apixaban', 'eliquis', 'dabigatran', 'pradaxa'],
  antiplatelets: ['aspirin', 'clopidogrel', 'plavix', 'ticagrelor', 'brilinta', 'prasugrel', 'effient'],
  antihypertensives: ['lisinopril', 'enalapril', 'losartan', 'cozaar', 'amlodipine', 'norvasc', 'metoprolol', 'lopressor', 'atenolol', 'carvedilol', 'coreg'],
  diabetes: ['metformin', 'insulin', 'glipizide', 'glyburide', 'sitagliptin', 'januvia', 'empagliflozin', 'jardiance'],
  cardiac: ['digoxin', 'amiodarone', 'diltiazem', 'verapamil'],
  lipids: ['atorvastatin', 'lipitor', 'simvastatin', 'rosuvastatin', 'crestor'],
  respiratory: ['albuterol', 'ventolin', 'fluticasone', 'flovent'],
  gastrointestinal: ['omeprazole', 'prilosec', 'pantoprazole', 'protonix', 'ranitidine'],
  psychiatric: ['sertraline', 'zoloft', 'fluoxetine', 'prozac', 'escitalopram', 'lexapro'],
  pain: ['ibuprofen', 'naproxen', 'acetaminophen', 'tylenol', 'tramadol', 'oxycodone'],
  other: []
} as const;


export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertDotPhrase = z.infer<typeof insertDotPhraseSchema>;
export type DotPhrase = typeof dotPhrases.$inferSelect;
// New types for presets
export type InsertUserPreset = z.infer<typeof insertUserPresetSchema>;
export type UserPreset = typeof userPresets.$inferSelect;
export type InsertRosNote = z.infer<typeof insertRosNoteSchema>;
export type RosNote = typeof rosNotes.$inferSelect;

// Team Groups types
export type InsertTeamGroup = z.infer<typeof insertTeamGroupSchema>;
export type TeamGroup = typeof teamGroups.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupTodo = z.infer<typeof insertGroupTodoSchema>;
export type GroupTodo = typeof groupTodos.$inferSelect;
export type InsertGroupEvent = z.infer<typeof insertGroupEventSchema>;
export type GroupEvent = typeof groupEvents.$inferSelect;
export type InsertUserLabSettings = z.infer<typeof insertUserLabSettingsSchema>;
export type UserLabSettings = typeof userLabSettings.$inferSelect;
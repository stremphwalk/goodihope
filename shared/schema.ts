import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dotPhrases = pgTable("dot_phrases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
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
  userId: integer("user_id").references(() => users.id).notNull(),
  patientName: text("patient_name").notNull(),
  patientDob: text("patient_dob").notNull(),
  patientMrn: text("patient_mrn").notNull(),
  selections: jsonb("selections").notNull(),
  medications: jsonb("medications").notNull().default('{"homeMedications":[],"hospitalMedications":[]}'),
  generatedNote: text("generated_note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDotPhraseSchema = createInsertSchema(dotPhrases).pick({
  userId: true,
  trigger: true,
  content: true,
  description: true,
  category: true,
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
export type InsertDotPhrase = z.infer<typeof insertDotPhraseSchema>;
export type DotPhrase = typeof dotPhrases.$inferSelect;
export type InsertRosNote = z.infer<typeof insertRosNoteSchema>;
export type RosNote = typeof rosNotes.$inferSelect;


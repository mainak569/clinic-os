# Audit Trail Design - ClinicOS

## 🎯 Overview

ClinicOS implements a comprehensive, **immutable audit trail system** for healthcare compliance. This document explains the design, implementation, and reasoning behind our audit architecture.

---

## 📋 Table of Contents

1. [Why Immutable Audit Trails?](#why-immutable-audit-trails)
2. [System Architecture](#system-architecture)
3. [Appointment History](#appointment-history)
4. [Visit Note History](#visit-note-history)
5. [Authorization Model](#authorization-model)
6. [Database Design](#database-design)
7. [Implementation Details](#implementation-details)
8. [Compliance Considerations](#compliance-considerations)

---

## 🔒 Why Immutable Audit Trails?

### Healthcare Regulatory Requirements

**HIPAA Compliance:**
- Requires complete audit trails of all PHI (Protected Health Information) access and modifications
- Must track who accessed what, when, and what changes were made
- Audit logs must be tamper-proof and cannot be modified or deleted

**Medical-Legal Protection:**
- Provides legal defense in malpractice cases
- Documents clinical decision-making process
- Proves compliance with standard of care

**Quality Assurance:**
- Enables review of clinical workflows
- Identifies patterns and training needs
- Supports performance improvement initiatives

### Immutability Principle

**Why Records Cannot Be Modified or Deleted:**

1. **Legal Integrity**: Once created, audit records must remain unchanged to maintain evidentiary value
2. **Regulatory Compliance**: HIPAA and other regulations require tamper-proof audit trails
3. **Trust**: Healthcare providers, patients, and regulators must trust the historical record
4. **Forensic Analysis**: Investigation of incidents requires unaltered historical data

**Database-Level Enforcement:**
- No UPDATE or DELETE queries on history tables
- Only INSERT operations allowed
- Enforced in service layer (no update/delete methods exist)
- Database permissions can further restrict access

---

## 🏗️ System Architecture

### Three-Tier History System

```
┌─────────────────────────────────────────────────┐
│          Application Layer                      │
│  • Server Actions (Authorization)               │
│  • UI Components (Display)                      │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│          Service Layer                          │
│  • Automatic history creation                   │
│  • Snapshot generation                          │
│  • Business logic                               │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│          Database Layer                         │
│  • AppointmentHistory (immutable)               │
│  • VisitNoteHistory (immutable)                 │
│  • Timestamp tracking                           │
└─────────────────────────────────────────────────┘
```

### Automatic vs Manual Tracking

**Automatic (Service Layer):**
- Visit note edits → automatic snapshot before update
- Appointment status changes → automatic history entry
- No developer intervention required

**Manual (Application Layer):**
- Provider changes → explicit history call with metadata
- Cancellation reasons → captured in notes field
- Supporting provider changes → tracked with context

---

## 📅 Appointment History

### What Gets Tracked

```typescript
enum HistoryAction {
  CREATED                      // Initial appointment creation
  UPDATED                      // General updates
  CANCELLED                    // Cancellation with reason
  CONFIRMED                    // Status: REQUESTED → CONFIRMED
  CHECKED_IN                   // Status: CONFIRMED → CHECKED_IN
  COMPLETED                    // Status: CHECKED_IN → COMPLETED
  NO_SHOW                      // Status: CONFIRMED → NO_SHOW
  RESCHEDULED                  // Time changed
  PROVIDER_CHANGED             // Primary provider reassignment
  SUPPORTING_PROVIDER_ADDED    // Additional provider added
  SUPPORTING_PROVIDER_REMOVED  // Additional provider removed
  NOTE_ADDED                   // Appointment note added
  NOTE_UPDATED                 // Appointment note modified
}
```

### Schema Design

```prisma
model AppointmentHistory {
  id            String        @id @default(cuid())
  appointmentId String
  action        HistoryAction
  
  // Field-specific tracking
  field         String?       // Which field changed
  previousValue String?       // Value before change
  newValue      String?       // Value after change
  
  // Context
  notes         String?       // Cancellation reason, etc.
  metadata      String?       // JSON for complex changes
  
  // Audit metadata - IMMUTABLE
  performedBy   String        // User ID (required)
  performedAt   DateTime      @default(now())
  
  // Relations
  appointment Appointment @relation(...)
  performer   User        @relation(...)
}
```

### Key Design Decisions

**1. Required User ID:**
- `performedBy` is NOT nullable
- Every change must be attributed to a user
- System actions use a designated system user ID

**2. Field-Level Tracking:**
- Granular tracking of what changed
- `field` column identifies the changed field
- `previousValue` and `newValue` store the change

**3. Flexible Metadata:**
- `notes` for human-readable context
- `metadata` JSON string for complex objects
- Supports extensibility without schema changes

**4. Timestamp as `performedAt`:**
- More semantically correct than `createdAt`
- Indicates when action was performed
- Default to `now()` but can be overridden if needed

---

## 📝 Visit Note History

### Two-Tier System

**Current Version (VisitNote table):**
- Mutable - can be edited by author
- Always represents latest version
- Includes author and last editor metadata

**Historical Versions (VisitNoteHistory table):**
- Immutable - complete snapshots
- Created automatically before each edit
- Preserves every version ever saved

### Schema Design

```prisma
model VisitNote {
  id            String   @id
  appointmentId String   @unique
  authorId      String   // Original author (never changes)
  
  // All clinical fields...
  
  // Audit tracking
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastEditedBy  String?  // Most recent editor
  lastEditedAt  DateTime?
  
  // Relations
  author     User                @relation("VisitNoteAuthor")
  lastEditor User?               @relation("VisitNoteEditor")
  history    VisitNoteHistory[]
}

model VisitNoteHistory {
  id           String   @id
  visitNoteId  String
  
  // Complete snapshot of ALL fields
  chiefComplaint       String?
  historyOfPresent     String?
  // ... all clinical fields ...
  
  // Audit metadata - IMMUTABLE
  editedBy      String   // User who made this edit
  editedAt      DateTime @default(now())
  changeReason  String?  // Optional reason for edit
  
  // Relations
  visitNote VisitNote @relation(...)
  editor    User      @relation(...)
}
```

### Snapshot Strategy

**When Snapshots Are Created:**

1. **Initial Creation**: First snapshot when note is created
2. **Before Every Edit**: Current state saved before applying changes
3. **Automatic**: Service layer handles this transparently

**Why Complete Snapshots (Not Diffs)?**

✅ **Advantages:**
- Simple to query any historical version
- No need to replay changes
- Direct comparison between versions
- Easy to display in UI

❌ **Disadvantages:**
- More storage space
- Redundant data for unchanged fields

**Decision:** Storage is cheap, simplicity is valuable. Complete snapshots win.

### Edit Authorization

**Who Can Edit:**
- ✅ Original author (authorId) can edit their own notes
- ❌ Other providers cannot edit
- ❌ Front desk cannot edit clinical notes
- ❌ System administrators cannot edit (clinical integrity)

**Enforced At:**
1. **Service Layer**: `canEditVisitNote()` method
2. **Server Actions**: Authorization check before calling service
3. **UI**: Edit button hidden if not author

---

## 🔐 Authorization Model

### Role-Based Access

| Role | Create Notes | Edit Own Notes | Edit Others' Notes | View History |
|------|--------------|----------------|-------------------|--------------|
| **PROVIDER** | ✅ (own appointments) | ✅ | ❌ | ✅ (own patients) |
| **FRONT_DESK** | ❌ | ❌ | ❌ | ✅ (all) |
| **ADMIN** | ❌ | ❌ | ❌ | ✅ (all) |

### Authorization Flow

```typescript
// 1. Server Action - Check authentication
const session = await requireAuth();

// 2. Server Action - Check role
if (session.user.role !== 'PROVIDER') {
  return { success: false, error: 'Only providers can edit notes' };
}

// 3. Service Layer - Check authorship
const canEdit = await visitNoteService.canEditVisitNote(noteId, userId);
if (!canEdit) {
  return { success: false, error: 'You can only edit your own notes' };
}

// 4. Service Layer - Create history snapshot (automatic)
await this.createHistorySnapshot(noteId, userId, reason);

// 5. Service Layer - Apply changes
await prisma.visitNote.update({...});
```

### Data Isolation

**Provider Data Isolation:**
- Providers can only access their own appointments
- Cannot view other providers' visit notes
- Exception: supporting/consulting providers (future feature)

**Front Desk Access:**
- Can view all appointments
- Can view all visit notes (for scheduling/coordination)
- Cannot create or edit clinical notes

---

## 💾 Database Design

### Indexes for Performance

```prisma
// AppointmentHistory
@@index([appointmentId])  // Query by appointment
@@index([action])         // Filter by action type
@@index([performedAt])    // Sort by time
@@index([performedBy])    // Query by user

// VisitNoteHistory
@@index([visitNoteId])    // Query by note
@@index([editedAt])       // Sort by time
```

### Relationships

**User Relations:**
```prisma
model User {
  visitNotesAuthored        VisitNote[]          @relation("VisitNoteAuthor")
  visitNotesEdited          VisitNote[]          @relation("VisitNoteEditor")
  visitNoteHistoryEdits     VisitNoteHistory[]   @relation("VisitNoteHistoryEditor")
  appointmentHistoryActions AppointmentHistory[] @relation("AppointmentHistoryPerformer")
}
```

**Why Separate Relations?**
- Clarity: Different roles (author vs editor vs performer)
- Flexibility: Can query "all notes I authored" vs "all notes I edited"
- Audit: Clear distinction in historical record

### Data Retention

**Policy:**
- Audit trails are **never deleted**
- Even when parent records are deleted, history remains
- Consider: `onDelete: Cascade` vs `onDelete: Restrict`

**Current Implementation:**
```prisma
appointment Appointment @relation(..., onDelete: Cascade)
```

**Production Consideration:**
For true immutability, consider `onDelete: Restrict` and soft-delete appointments instead.

---

## 💻 Implementation Details

### Service Layer Patterns

**Automatic History Creation:**

```typescript
async updateVisitNote(noteId, editorId, updates) {
  // 1. Validate note exists
  const currentNote = await prisma.visitNote.findUnique({...});
  
  // 2. Create snapshot BEFORE updating
  await this.createHistorySnapshot(noteId, editorId, updates.reason);
  
  // 3. Apply updates
  const updated = await prisma.visitNote.update({...});
  
  // 4. Return updated note
  return updated;
}
```

**Private Snapshot Method:**

```typescript
private async createHistorySnapshot(noteId, editorId, reason) {
  const current = await prisma.visitNote.findUnique({...});
  
  // Create complete snapshot
  await prisma.visitNoteHistory.create({
    data: {
      visitNoteId: noteId,
      editedBy: editorId,
      changeReason: reason,
      // Copy ALL fields from current version
      chiefComplaint: current.chiefComplaint,
      historyOfPresent: current.historyOfPresent,
      // ... all other fields ...
    },
  });
}
```

### Error Handling

**Immutability Violations:**

```typescript
// Service layer - no update/delete methods exist
class VisitNoteService {
  // ✅ Has: createHistorySnapshot (private)
  // ❌ NO: updateHistory()
  // ❌ NO: deleteHistory()
}
```

**If someone tries to modify history directly:**
- Prisma queries would need to be crafted manually
- Code review would catch this
- Database permissions can prevent this
- Application layer has no methods to do this

---

## 📊 UI Components

### Timeline Component

**Features:**
- Chronological display of all changes
- Color-coded by action type
- Shows performer and timestamp
- Displays field changes and notes
- Immutability notice

**Usage:**
```typescript
<AppointmentTimeline events={appointmentHistory} />
```

### Visit Note History Component

**Features:**
- Version list with expand/collapse
- Complete snapshot view for each version
- Shows editor and edit reason
- Diff-friendly layout
- Immutability notice

**Usage:**
```typescript
<VisitNoteHistory versions={visitNoteHistory} />
```

---

## 📋 Compliance Considerations

### HIPAA Requirements

**Access Control (§164.312(a)):**
- ✅ Unique user identification (performedBy/editedBy)
- ✅ Automatic logoff (session timeout)
- ✅ Audit controls (complete history)

**Audit Controls (§164.312(b)):**
- ✅ Hardware, software, and procedural mechanisms
- ✅ Record and examine access and activity
- ✅ Information systems with PHI

**Integrity (§164.312(c)(1)):**
- ✅ Ensure PHI is not improperly altered or destroyed
- ✅ Immutable audit trails prove integrity

### Medical Records Laws

**State Requirements:**
- Most states require medical records be retained 7-10 years
- Some require indefinite retention of certain records
- Audit trails support retention requirements

**Amendments:**
- If a patient requests amendment, original record must be preserved
- Amendment should be added as new entry with reason
- History trail supports this workflow

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Cryptographic Signatures**
   - Sign each history entry with provider's digital signature
   - Tamper-evident using blockchain or hash chains
   - Enhanced legal standing

2. **Change Detection UI**
   - Visual diff between versions
   - Highlight changed fields
   - Side-by-side comparison

3. **Advanced Filtering**
   - Filter history by date range
   - Filter by user
   - Filter by action type

4. **Export & Reporting**
   - Export audit trail to PDF
   - Compliance reports
   - Activity summaries

5. **Real-time Notifications**
   - Alert on sensitive changes
   - Notify supervisors of deletions
   - Compliance officer dashboards

6. **Supporting Provider Trail**
   - Track consultations
   - Multi-provider collaboration
   - Referral documentation

---

## 🎓 Best Practices

### For Developers

1. **Never Expose Update/Delete:**
   - Don't create methods that modify history
   - Don't expose history IDs to frontend
   - Make history tables read-only at DB level

2. **Always Record User:**
   - Never use nullable performer fields
   - Create system user for automated actions
   - Include user context in all mutations

3. **Snapshot Before Update:**
   - Always create history before modifying
   - Use transactions if necessary
   - Handle failures gracefully

4. **Document Reasons:**
   - Encourage meaningful change reasons
   - Provide UI prompts for context
   - Store business justifications

### For Healthcare Providers

1. **Document Thoroughly:**
   - Provide detailed change reasons
   - Explain clinical reasoning
   - Note important observations

2. **Timely Documentation:**
   - Document as soon as possible
   - Note delays if they occur
   - Explain late entries

3. **Review History:**
   - Check history before editing
   - Understand previous decisions
   - Maintain continuity of care

---

## 📚 Summary

ClinicOS implements a **comprehensive, immutable audit trail system** that:

✅ **Meets Healthcare Compliance**: HIPAA-compliant audit controls
✅ **Protects Legal Interests**: Tamper-proof historical record
✅ **Enables Quality Improvement**: Complete activity tracking
✅ **Maintains Data Integrity**: Immutable by design
✅ **Supports Clinical Care**: Historical context for decision-making

**Key Principles:**
1. **Immutability**: History cannot be changed or deleted
2. **Attribution**: Every change tied to a user
3. **Completeness**: Full snapshots, not diffs
4. **Automation**: Service layer handles history transparently
5. **Authorization**: Only authors can edit their notes

**Implementation:**
- Database: Separate history tables with full snapshots
- Service Layer: Automatic snapshot creation
- Server Actions: Authorization enforcement
- UI Components: Clear history visualization

This design provides the foundation for a trustworthy, compliant healthcare system.

---

## 🔗 Related Documentation

- [Authentication System](./authentication-system.md)
- [Appointment Domain Architecture](./appointment-domain-architecture.md)
- [Database Schema](./schema.md)


# Audit Trail System - Quick Reference

## 🎯 Quick Start

### Visit Notes

```typescript
// Create
import { createVisitNote } from '@/app/actions/visit-note.actions';
await createVisitNote({ appointmentId, chiefComplaint, assessment, plan, ... });

// Update (author only)
import { updateVisitNote } from '@/app/actions/visit-note.actions';
await updateVisitNote({ visitNoteId, changeReason: "Adding labs", assessment: "..." });

// Get history
import { getVisitNoteHistory } from '@/app/actions/visit-note.actions';
const result = await getVisitNoteHistory({ visitNoteId });
```

### UI Components

```typescript
// Appointment Timeline
import { AppointmentTimeline } from '@/components/appointments/appointment-timeline';
<AppointmentTimeline events={appointmentHistory} />

// Visit Note History
import { VisitNoteHistory } from '@/components/appointments/visit-note-history';
<VisitNoteHistory versions={visitNoteHistory} />
```

---

## 📊 Authorization Rules

### Visit Notes

| Action | Provider (Own) | Provider (Others) | Front Desk |
|--------|----------------|-------------------|------------|
| Create | ✅ | ❌ | ❌ |
| Edit | ✅ (if author) | ❌ | ❌ |
| View | ✅ | ❌ | ✅ |
| History | ✅ | ❌ | ✅ |

### Appointment History

| Action | Provider (Own) | Provider (Others) | Front Desk |
|--------|----------------|-------------------|------------|
| View | ✅ | ❌ | ✅ |

**Note:** History records are created automatically by the system.

---

## 🔑 Key Concepts

### Immutability

**History records cannot be:**
- ❌ Updated
- ❌ Deleted
- ❌ Modified in any way

**Why?**
- Healthcare compliance (HIPAA)
- Legal protection
- Audit integrity
- Trust and transparency

### Automatic Snapshots

**Visit notes:**
```typescript
// Before every update, service layer automatically:
1. Gets current note state
2. Creates complete snapshot in VisitNoteHistory
3. Applies updates to VisitNote
4. Updates lastEditedBy/At
```

**You don't need to:**
- Manually create history records
- Track changes yourself
- Remember to snapshot

### Complete Snapshots (Not Diffs)

**Each history record contains:**
- ✅ ALL fields (complete snapshot)
- ✅ Editor information
- ✅ Timestamp
- ✅ Change reason

**NOT:**
- ❌ Only changed fields (diffs)
- ❌ Delta/patch format

**Why?**
- Simple to query any version
- Easy to display
- No need to replay changes

---

## 🏗️ Architecture Pattern

```
User Action
    ↓
Server Action (Authorization)
    ↓
Service Layer (Business Logic)
    ├─ Create snapshot (before update)
    └─ Apply update
    ↓
Database
    ├─ Current (VisitNote - mutable)
    └─ History (VisitNoteHistory - immutable)
```

---

## 📝 Data Models

### VisitNote (Current Version)

```typescript
{
  id: string
  appointmentId: string
  authorId: string              // Original author (never changes)
  
  // Clinical fields...
  chiefComplaint?: string
  assessment?: string
  plan?: string
  // ... vitals, orders, prescriptions
  
  // Audit metadata
  createdAt: Date
  updatedAt: Date
  lastEditedBy?: string         // Most recent editor
  lastEditedAt?: Date
}
```

### VisitNoteHistory (All Versions)

```typescript
{
  id: string
  visitNoteId: string
  
  // Complete snapshot of ALL clinical fields
  chiefComplaint?: string
  assessment?: string
  plan?: string
  // ... all vitals, orders, prescriptions
  
  // Audit metadata (IMMUTABLE)
  editedBy: string              // Who made this edit
  editedAt: Date                // When
  changeReason?: string         // Why
}
```

### AppointmentHistory

```typescript
{
  id: string
  appointmentId: string
  action: HistoryAction         // CREATED, CONFIRMED, CANCELLED, etc.
  
  // Field-level tracking
  field?: string                // What changed
  previousValue?: string        // Before
  newValue?: string             // After
  
  // Context
  notes?: string                // Cancellation reason, etc.
  metadata?: string             // JSON for complex changes
  
  // Audit metadata (IMMUTABLE)
  performedBy: string           // User ID (required)
  performedAt: Date
}
```

---

## 🔒 Security Checklist

- [x] Authentication required for all operations
- [x] Authorization at server action boundary
- [x] Provider data isolation enforced
- [x] Author-only editing for visit notes
- [x] Input validation with Zod
- [x] SQL injection prevented (Prisma)
- [x] History is read-only
- [x] Proper error messages

---

## 📋 HIPAA Compliance

**Access Control (§164.312(a)):**
- ✅ Unique user identification
- ✅ Automatic logoff
- ✅ Audit controls

**Audit Controls (§164.312(b)):**
- ✅ Record all PHI access
- ✅ Examine activity via history

**Integrity (§164.312(c)(1)):**
- ✅ Prevent improper alteration
- ✅ Immutable audit logs

**Authentication (§164.312(d)):**
- ✅ All changes tied to users
- ✅ No anonymous modifications

---

## 🧪 Testing Checklist

**Visit Notes:**
- [ ] Create as provider (own appointment) ✓
- [ ] Create as provider (other's appointment) ✗
- [ ] Edit as author ✓
- [ ] Edit as non-author ✗
- [ ] View history shows all versions

**Appointment History:**
- [ ] Status changes logged automatically
- [ ] Rescheduling tracked with old/new times
- [ ] Cancellation reason captured
- [ ] Timeline displays all events

**Authorization:**
- [ ] Provider can only edit own notes
- [ ] Front desk can view but not edit
- [ ] Proper error messages

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `docs/audit-trail-design.md` | Complete architecture and rationale |
| `docs/VISIT_NOTES_IMPLEMENTATION.md` | Implementation details and examples |
| `docs/AUDIT_TRAIL_QUICK_REFERENCE.md` | This quick reference |
| `AUDIT_TRAIL_COMPLETE.md` | Executive summary |

---

## 💡 Common Patterns

### Pattern 1: Create Visit Note

```typescript
const result = await createVisitNote({
  appointmentId: 'appt_123',
  chiefComplaint: 'Patient presents with...',
  assessment: 'Diagnosis...',
  plan: 'Treatment plan...',
  bloodPressure: '120/80',
  heartRate: 72,
  prescriptions: 'Medication...',
});
```

### Pattern 2: Update with Reason

```typescript
const result = await updateVisitNote({
  visitNoteId: 'note_123',
  changeReason: 'Adding lab results',
  assessment: 'Updated based on labs...',
  labOrders: 'Complete blood count - results normal',
});
// Snapshot created automatically before update
```

### Pattern 3: Display History

```typescript
// Server component
const history = await visitNoteService.getVisitNoteHistory(noteId);

return <VisitNoteHistory versions={history} />;
```

### Pattern 4: Authorization Check

```typescript
// Check if user can edit
const canEdit = await visitNoteService.canEditVisitNote(noteId, userId);

if (canEdit) {
  // Show edit button
} else {
  // Show view-only mode
}
```

---

## 🚨 Common Mistakes

### ❌ Don't: Manually Create History

```typescript
// DON'T DO THIS
await prisma.visitNoteHistory.create({...});
```

**Why?** Service layer handles this automatically.

### ❌ Don't: Update History

```typescript
// DON'T DO THIS
await prisma.visitNoteHistory.update({...});
```

**Why?** History is immutable. No update methods exist.

### ❌ Don't: Delete History

```typescript
// DON'T DO THIS
await prisma.visitNoteHistory.delete({...});
```

**Why?** History is permanent for compliance.

### ❌ Don't: Skip Change Reason

```typescript
// DON'T DO THIS
await updateVisitNote({ visitNoteId, assessment: "..." });
// No changeReason provided
```

**Do This:**
```typescript
await updateVisitNote({ 
  visitNoteId, 
  changeReason: 'Correcting typo in medication name',
  assessment: "..." 
});
```

---

## ✅ Best Practices

### 1. Always Provide Change Reasons

```typescript
✅ changeReason: 'Adding lab results received today'
✅ changeReason: 'Correcting medication dosage'
❌ changeReason: undefined
❌ changeReason: 'Updated'
```

### 2. Document Thoroughly

```typescript
✅ assessment: 'Acute bronchitis based on chest X-ray showing...'
❌ assessment: 'Bronchitis'
```

### 3. Use Service Layer for Business Logic

```typescript
✅ await visitNoteService.updateVisitNote(...)
❌ await prisma.visitNote.update(...) // Skip service layer
```

### 4. Check Authorization in Server Actions

```typescript
✅ 
const canEdit = await visitNoteService.canEditVisitNote(noteId, userId);
if (!canEdit) return { success: false, error: '...' };

❌
// Skip authorization check
```

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `lib/services/visit-note.service.ts` | Business logic |
| `app/actions/visit-note.actions.ts` | Server actions |
| `lib/validations/visit-note.ts` | Input validation |
| `components/appointments/appointment-timeline.tsx` | Timeline UI |
| `components/appointments/visit-note-history.tsx` | History UI |

---

## 📞 Support

**Need help?**
1. Check this quick reference
2. Review `docs/audit-trail-design.md` for architecture
3. See `docs/VISIT_NOTES_IMPLEMENTATION.md` for examples
4. Look at `components/appointments/appointment-detail-example.tsx`

**Common questions:**
- How to create notes? → See Pattern 1
- How to update notes? → See Pattern 2
- How to display history? → See Pattern 3
- Why immutable? → See Key Concepts
- HIPAA compliance? → See HIPAA Compliance section

---

**🎉 Quick reference complete! Happy coding! 🎉**


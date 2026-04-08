# Quick Visual Guide - Signing Requisitions in View Mode

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIEW REQUISITION PAGE                        │
│                  (User with Requisition Role)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  1. Enter Your Name in Field            │
        │     • Reviewed By                       │
        │     • Approved By                       │
        │     • Authorized By                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  2. Click "Sign [Role]" Button          │
        │     Example: "Sign Review"              │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  3. Signature Pad Opens                 │
        │     ┌──────────────────────┐            │
        │     │  Draw your signature │            │
        │     │         here         │            │
        │     └──────────────────────┘            │
        │     [Clear]  [Save]                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  4. Click "Save" on Signature Pad       │
        │     • Signature appears as preview      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  5. Click "Save Signature" Button       │
        │     (Blue button at bottom of form)     │
        │                                         │
        │  [Back to List]  [💾 Save Signature]   │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  6. Success! ✅                         │
        │     • Signature saved to database       │
        │     • Page refreshes                    │
        │     • Signature is now permanent        │
        └─────────────────────────────────────────┘
```

## Screen Layout

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to List                                            │
│                                                            │
│  ╔══════════════════════════════════════════════════╗    │
│  ║  REVIEW SECTION                                   ║    │
│  ║                                                   ║    │
│  ║  Reviewed By: [John Doe _____________]           ║    │
│  ║                                                   ║    │
│  ║  [✏️ Sign Review]  ← Click to sign               ║    │
│  ║                                                   ║    │
│  ║  OR (after signing):                             ║    │
│  ║  ┌─────────────────┐                             ║    │
│  ║  │ John's Sig      │  ← Signature preview        ║    │
│  ║  └─────────────────┘                             ║    │
│  ╚══════════════════════════════════════════════════╝    │
│                                                            │
│  ╔══════════════════════════════════════════════════╗    │
│  ║  APPROVAL SECTION                                 ║    │
│  ║                                                   ║    │
│  ║  Approved By: [Jane Smith ___________]           ║    │
│  ║                                                   ║    │
│  ║  [✏️ Sign Approval]                              ║    │
│  ╚══════════════════════════════════════════════════╝    │
│                                                            │
│  ╔══════════════════════════════════════════════════╗    │
│  ║  AUTHORIZATION SECTION                            ║    │
│  ║                                                   ║    │
│  ║  Authorized By: [Bob Johnson __________]         ║    │
│  ║                                                   ║    │
│  ║  [✏️ Sign Authorization]                         ║    │
│  ╚══════════════════════════════════════════════════╝    │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  [← Back to List]                                          │
│                                                            │
│           [❌ Reject Requisition] [💾 Save Signature]     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Button States

### Before Signing:
```
[← Back to List]  [❌ Reject Requisition] [💾 Save Signature]
                                              ↑
                                    (Grayed out until 
                                     signature added)
```

### After Signing (Ready to Save):
```
[← Back to List]  [❌ Reject Requisition] [💾 Save Signature]
                                              ↑
                                    (Blue, clickable)
```

### Completed Requisition (All signatures done):
```
[← Back to List]  
✅ Approval Completed - No Further Edits Allowed
```

## Role-Based Visibility

| Button | Reviewer | Approver | Authorizer | Admin | Regular User |
|--------|----------|----------|------------|-------|--------------|
| **Sign Review** | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Sign Approval** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Sign Authorization** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Reject Requisition** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Save Signature** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |

## Common Scenarios

### Scenario 1: Single Role User (Reviewer Only)
```
1. Login as Reviewer
2. Open pending requisition
3. Enter name in "Reviewed By"
4. Click "Sign Review"
5. Draw signature → Save
6. Click "Save Signature" ✅
7. Done! Requisition moves to approver
```

### Scenario 2: Multi-Role User (Reviewer + Approver)
```
1. Login as user with both roles
2. Open pending requisition
3. Review section:
   - Enter name → Sign → Save to pad
4. Approval section:
   - Enter name → Sign → Save to pad
5. Click "Save Signature" once
6. Both signatures saved! ✅
```

### Scenario 3: Admin Signs Everything
```
1. Login as Admin
2. Open any pending requisition
3. Can sign all sections:
   - Review → Sign
   - Approval → Sign
   - Authorization → Sign
4. Click "Save Signature"
5. All signatures saved! ✅
```

### Scenario 4: Reject Instead of Sign
```
1. Login as user with requisition role
2. Open requisition with issues
3. Don't sign
4. Click "Reject Requisition" ❌
5. Enter rejection reason
6. Submit rejection
7. Requester notified via email
```

## Error Messages

| Situation | Error Message | Solution |
|-----------|---------------|----------|
| No name entered | "Please enter the reviewer name first" | Type name in field |
| Empty signature | "Please provide a signature first" | Draw signature on pad |
| No signatures to save | "Please add at least one signature" | Add signature first |
| Completed requisition | Fields disabled | Cannot modify completed |
| Not your role | Button not visible | Need requisition role |

## Success Indicators

✅ **Signature Saved Successfully:**
- Green success message appears
- Page refreshes automatically
- Signature shows as image (not button)
- Other users can see it

✅ **Requisition Updated:**
- Database updated with signature
- Status may change (e.g., "pending" → "reviewed")
- Next person in workflow gets notification

---

**Quick Reference:** Remember the 5 S's
1. **S**elect requisition
2. **S**ign your name (type it)
3. **S**ign your signature (draw it)
4. **S**ave signature (click button)
5. **S**uccess! Done ✅

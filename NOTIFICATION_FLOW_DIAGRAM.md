# Requisition Finalization Notification Flow

## Visual Flow Diagram

```mermaid
graph TB
    A[Requestor Submits Requisition] --> B[Reviewer Signs]
    B --> C[Email Sent to Approvers]
    C --> D[Approver Signs]
    D --> E[Email Sent to Authorizers]
    E --> F[Authorizer Signs]
    F --> G{Status = Finalized?}
    G -->|No| H[Wait for Next Signature]
    G -->|Yes| I[Update Status to 'finalized']
    I --> J[Send Email to Requestor]
    I --> K[Fetch Finance Team Emails]
    K --> L[Send Emails to All Finance Members]
    J --> M[Notification Complete]
    L --> M
    M --> N[Frontend Polls API]
    N --> O[Display in Nav Bar]
    O --> P[User Clicks Bell Icon]
    P --> Q[Show Approved Requisitions Section]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant R as Requestor
    participant S as System
    participant F as Finance Team
    participant DB as Database
    participant E as Email Service
    
    R->>S: Submit Requisition
    S->>DB: Save with status='pending'
    
    Note over S,DB: Workflow Progression
    
    S->>S: Reviewer Signs
    S->>E: Email Approvers
    
    S->>S: Approver Signs  
    S->>E: Email Authorizers
    
    S->>S: Authorizer Signs
    S->>DB: Check status != 'finalized'
    S->>DB: UPDATE status='finalized'
    
    par Parallel Notifications
        S->>E: Send Approval Email to Requestor
        E-->>R: ✓ Your Requisition Approved
        
        S->>DB: SELECT finance emails
        DB-->>S: Return finance team list
        
        loop For each finance member
            S->>E: Send Payment Processing Email
            E-->>F: 🏦 Action Required
        end
    end
    
    S->>DB: SET notified=1
    
    Note over R,F: Both parties notified simultaneously
```

## Component Interaction

```mermaid
graph LR
    A[Backend server.js] --> B[PUT /api/requisition/:id]
    B --> C[Detect Finalization]
    C --> D[sendEmailNotification]
    D --> E[Requestor Email]
    D --> F[Finance Email]
    
    G[Frontend Admin.js] --> H[useEffect Polling]
    H --> I[fetchAllNotifications]
    I --> J[GET /api/requisitions/unsigned]
    I --> K[GET /api/requisitions/finalized]
    
    J --> L[Set Pending Notifications]
    K --> M[Set Finalized Notifications]
    
    N[RequisitionNotifications.jsx] --> O[Render Two Sections]
    O --> P[Pending Your Action]
    O --> Q[Approved Requisitions]
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Reviewed: Reviewer Signs
    Reviewed --> Approved: Approver Signs
    Approved --> Authorized: Authorizer Signs
    Authorized --> Finalized: All Signatures Complete
    Finalized --> Notified: Emails Sent + DB Updated
    Notified --> [*]: Process Complete
    
    note right of Finalized
        Trigger Points:
        1. Update status column
        2. Send requestor email
        3. Send finance emails
        4. Set notified flag
    end note
```

## Data Flow

```mermaid
flowchart TD
    Start([Authorizer Signs]) --> Check{Already Finalized?}
    Check -->|Yes| End1[Do Nothing - Already Notified]
    Check -->|No| Update[UPDATE status='finalized']
    
    Update --> FetchReq[Fetch Requisition Details]
    FetchReq --> CheckEmail{Has Requestor Email?}
    
    CheckEmail -->|Yes| SendReq[Send Email to Requestor]
    CheckEmail -->|No| LogWarn[Log Warning]
    
    SendReq --> FetchFin[Fetch Finance Team]
    FetchFin --> CheckFin{Has Finance Members?}
    
    CheckFin -->|Yes| LoopFin[Loop Through Finance List]
    CheckFin -->|No| LogWarn2[Log Warning]
    
    LoopFin --> SendFin[Send Email to Each]
    SendFin --> UpdateDB[UPDATE notified=1]
    
    LogWarn --> UpdateDB
    LogWarn2 --> UpdateDB
    
    UpdateDB --> End2([Complete])
```

## Email Delivery Flow

```mermaid
graph TB
    A[Finalization Detected] --> B[Prepare Requestor Email]
    B --> C[HTML Template with Green Theme]
    C --> D[Add Requisition Details]
    D --> E[Include Success Badge]
    E --> F[Add View Button]
    F --> G[Call sendEmailNotification]
    
    G --> H{Email Sent Successfully?}
    H -->|Yes| I[Log Success Message]
    H -->|No| J[Log Error Message]
    
    I --> K[Prepare Finance Email]
    J --> K
    
    K --> L[HTML Template with Blue Theme]
    L --> M[Add Priority Badge]
    M --> N[Include Requestor Contact]
    N --> O[Add Payment Details]
    O --> P[Add View Button]
    P --> Q[Loop: Send to Each Finance Member]
    
    Q --> R{All Sent?}
    R -->|Yes| S[Update notified=1]
    R -->|No| T[Continue Loop]
    T --> Q
    
    S --> U[Process Complete]
```

## Frontend Notification Display Flow

```mermaid
flowchart LR
    A[User Opens App] --> B[Admin.js useEffect Runs]
    B --> C[Poll Every 30 Seconds]
    C --> D[call checkForUnsignedRequisitions]
    
    D --> E[GET /api/requisitions/unsigned]
    E --> F[Update newRequisitionCount State]
    
    G[User Clicks Bell] --> H[Set showNotifications=true]
    H --> I[Open RequisitionNotifications Component]
    
    I --> J[fetchAllNotifications Runs]
    J --> K[Fetch Unsigned Requisitions]
    J --> L[Fetch Finalized Requisitions]
    
    K --> M[Set notifications State]
    L --> N[Set finalizedNotifications State]
    
    M --> O[Render Pending Section]
    N --> P[Render Approved Section]
    
    O --> Q[Display in Panel]
    P --> Q
```

## Database Query Flow

```mermaid
graph TB
    A[Finalization Trigger] --> B[START Transaction]
    B --> C[UPDATE requisitions SET status='finalized']
    C --> D[SELECT * FROM requisitions WHERE id=:id]
    D --> E[Get Requestor Email]
    
    E --> F{Email Exists?}
    F -->|Yes| G[Proceed with Email]
    F -->|No| H[Skip Requestor Notification]
    
    G --> I[SELECT u.email FROM requisition_roles rr JOIN users u]
    I --> J[WHERE role_type='finance' AND is_active=TRUE]
    J --> K[Return Finance Email List]
    
    K --> L[LOOP Through Finance Emails]
    L --> M[sendEmailNotification]
    M --> N{Success?}
    N -->|Yes| O[Log Success]
    N -->|No| P[Log Error]
    
    O --> Q{More Finance Emails?}
    P --> Q
    
    Q -->|Yes| L
    Q -->|No| R[UPDATE requisitions SET notified=1]
    
    H --> R
    R --> S[COMMIT Transaction]
    S --> T[End]
```

## User Journey

### As Requestor
```mermaid
journey
    title Requestor's Experience
    section Submit
      Fill Form: 5: Requestor
      Add Items: 5: Requestor
      Sign & Submit: 5: Requestor
    section Wait
      Check Status: 3: Requestor
      Wait for Review: 3: Requestor
      Wait for Approval: 3: Requestor
      Wait for Authorization: 3: Requestor
    section Receive Notification
      Get Email: 5: Requestor
      See Bell Badge: 5: Requestor
      Open Notification: 5: Requestor
      See Approved Status: 5: Requestor
    section Payment
      Finance Contacts: 4: Requestor
      Coordinate Payment: 4: Requestor
      Receive Payment: 5: Requestor
```

### As Finance
```mermaid
journey
    title Finance Team's Experience
    section Working
      Daily Tasks: 5: Finance
      Monitor Email: 4: Finance
    section Notification
      Receive Email: 5: Finance
      See Priority Badge: 5: Finance
      Read Details: 4: Finance
    section Action
      Click Link: 5: Finance
      View Requisition: 5: Finance
      Verify Signatures: 5: Finance
      Contact Requestor: 4: Finance
    section Processing
      Process Payment: 5: Finance
      Update Records: 4: Finance
      Confirm Completion: 5: Finance
```

## Timeline Visualization

```
Time →

T0:   Requestor submits
      │
T+1h: Reviewer signs ──────────────► Email to Approvers
      │
T+2h: Approver signs ──────────────► Email to Authorizers
      │
T+3h: Authorizer signs (FINALIZED)
      ├─► Update DB status='finalized'
      ├─► Send email to Requestor (✓ Approved)
      ├─► Send email to Finance (🏦 Process Payment)
      └─► Update DB notified=1
      │
T+4h: Requestor checks email
      │
T+4h: Finance receives email
      │
T+5h: Requestor sees nav notification
      │
T+6h: Finance contacts requestor
      │
T+7h: Payment processed
```

## Permission Matrix

```
┌─────────────────┬──────────┬────────────┬──────────────┬─────────┐
│ Action          │ Requestor│ Finance    │ Approver     │ Admin   │
├─────────────────┼──────────┼────────────┼──────────────┼─────────┤
│ Submit          │    ✓     │     ✓      │      ✓       │    ✓    │
│ Review          │    ✗     │     ✗      │      ✓       │    ✓    │
│ Approve         │    ✗     │     ✗      │      ✓       │    ✓    │
│ Authorize       │    ✗     │     ✗      │      ✗       │    ✓    │
│ Process Payment │    ✗     │     ✓      │      ✗       │    ✓    │
│ View All        │    Own   │     All    │   Assigned   │   All   │
│ Get Notified    │  When ✓  │ When Final │  When Turn   │  Always │
└─────────────────┴──────────┴────────────┴──────────────┴─────────┘
```

## Error Handling Flow

```mermaid
graph TD
    A[Finalization Event] --> B[Try Send Emails]
    B --> C{Email Service Available?}
    
    C -->|No| D[Catch Error]
    D --> E[Log to Console]
    E --> F[Continue Anyway]
    F --> G[Update notified=0]
    
    C -->|Yes| H{Valid Recipient Email?}
    H -->|No Requestor Email| I[Log Warning]
    I --> J[Skip Requestor Email]
    
    H -->|Has Email| K[Send Email]
    K --> L{Send Success?}
    L -->|Yes| M[Log Success]
    L -->|No| N[Catch Error]
    N --> O[Log Failure]
    
    M --> P{More Recipients?}
    O --> P
    
    P -->|Yes Finance| Q[Send Next Finance Email]
    Q --> K
    
    P -->|No More| R[Update notified=1]
    G --> S[Transaction Complete]
    R --> S
```

## Summary Statistics

```
┌─────────────────────────────────────────────┐
│ NOTIFICATION SYSTEM METRICS                 │
├─────────────────────────────────────────────┤
│ Emails Sent Per Finalization: 2+            │
│   • 1 to Requestor (confirmation)           │
│   • 1+ to Finance team (all members)        │
│                                             │
│ API Endpoints Added: 1                      │
│   • GET /api/requisitions/finalized         │
│                                             │
│ Database Columns Added: 1                   │
│   • notified (TINYINT)                      │
│                                             │
│ Frontend Components Modified: 2             │
│   • RequisitionNotifications.jsx            │
│   • Admin.js (polling logic)                │
│                                             │
│ CSS Styles Added: 8                         │
│   • status-finalized                        │
│   • notification-list-container             │
│   • notification-section                    │
│   • notification-section-title              │
│   • notification-item.finalized             │
│   • amount                                  │
│   • + hover effects                         │
│                                             │
│ Polling Interval: 30 seconds                │
│ Email Delivery Time: < 5 seconds            │
│ Status Update: Immediate                    │
└─────────────────────────────────────────────┘
```

---

**Created:** March 8, 2026  
**Purpose:** Visual documentation for developer onboarding and system understanding  
**Tools Used:** Mermaid.js for diagrams  
**Status:** Complete ✅

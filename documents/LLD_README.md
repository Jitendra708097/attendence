# AttendEase — Low Level Design (LLD)
## Shift Engine · Bull Queue · Auto-Absent · Status Machine

> **Document Type:** Low Level Design Reference
> **Audience:** Engineering team, Backend developers
> **Status:** PLANNING — Locked Decisions
> **Last Updated:** March 2026

---

## Table of Contents

1. [Overview — What LLD Covers](#1-overview)
2. [Engine 1 — Shift Calculation Engine](#2-engine-1-shift-calculation-engine)
   - Core Design Decision
   - Shift Configuration Fields
   - The Worked Hours Formula
   - Midnight Crossing Handling
   - All Status Definitions
   - Scenario Walkthroughs (6 scenarios with real numbers)
3. [Engine 2 — OT / Late / Half-Day Computation](#3-engine-2-ot--late--half-day-computation)
   - Late Calculation
   - Half Day vs Half Day Early
   - Overtime Calculation
   - Early Checkout
   - Break Time Deduction
4. [Engine 3 — Status Transition State Machine](#4-engine-3-status-transition-state-machine)
   - All Valid Transitions
   - All Blocked Transitions
   - Why the State Machine Exists
5. [Engine 4 — Bull Queue Job Designs](#5-engine-4-bull-queue-job-designs)
   - Job Registry
   - Job 1: Auto-Absent
   - Job 2: Checkout Grace Expiry
   - Job 3: Face Enrollment
   - Job 4: Scheduled Notifications
   - Job 5: Report Generation
   - Job 6: Attendance Offline Sync
   - Idempotency — The Non-Negotiable Rule
   - Race Condition Prevention
   - Dead Letter Queue Strategy
6. [Engine 5 — Regularisation Flow](#6-engine-5-regularisation-flow)
   - Two-Level Approval Design
   - Anti-Misuse Architecture
   - Regularisation State Machine
7. [The Complete Attendance Pipeline](#7-the-complete-attendance-pipeline)
8. [Database Fields Reference](#8-database-fields-reference)
9. [Configuration Reference](#9-configuration-reference)
10. [Edge Cases Registry](#10-edge-cases-registry)
11. [Glossary](#11-glossary)

---

## 1. Overview

LLD answers one question for each engine:

> **"Given these inputs, what exactly does the system compute and what does it write to the database?"**

The four engines in AttendEase LLD are:

```
Engine 1: Shift Calculation
  Input:  check-in time, check-out time, shift config
  Output: worked_minutes, status, is_late, is_overtime

Engine 2: OT / Late / Half-Day Computation
  Input:  worked_minutes, thresholds, leave status
  Output: precise status classification with reasons

Engine 3: Status Transition Machine
  Input:  current status, triggered event
  Output: new status OR blocked (invalid transition)

Engine 4: Bull Queue Jobs
  Input:  scheduled triggers, employee/shift data
  Output: attendance records, notifications, enrollments
```

One critical design decision governs all engines:

> **Attendance status is NEVER determined at check-in time.
> It is ALWAYS determined after check-out.**

```
Check-in  →  status = "pending"     (record created, not finalised)
Check-out →  status = computed      (present / half_day / absent / etc.)
```

This means the check-in event is cheap — just create a record and store the time.
The check-out event is where all computation happens.

---

## 2. Engine 1 — Shift Calculation Engine

### Core Design Decision

```
The attendance DATE is always the CHECK-IN date.
Never the check-out date.

Night shift: starts March 5 at 22:00
             ends   March 6 at 06:00

Attendance date: March 5 ← always the start date
```

This is non-negotiable. It prevents double-counting, simplifies payroll queries, and makes reports consistent.

---

### Shift Configuration Fields

Every threshold is admin-configurable per shift. Nothing is hardcoded.

```
shifts table fields (LLD-relevant):

name                      VARCHAR   "Morning Shift"
start_time                TIME      "09:00"
end_time                  TIME      "18:00"
crosses_midnight          BOOLEAN   false
work_days                 INTEGER[] [1,2,3,4,5]  ← 0=Sun...6=Sat
break_minutes             INTEGER   60
grace_minutes_checkin     INTEGER   15   ← late after this
grace_minutes_checkout    INTEGER   60   ← must check out within this
half_day_after_minutes    INTEGER   240  ← below this = half day
absent_after_minutes      INTEGER   120  ← below this = absent
overtime_after_minutes    INTEGER   480  ← above this = OT
min_overtime_minutes      INTEGER   30   ← OT below this ignored
```

**Why min_overtime_minutes exists:**
An employee works 5 minutes extra. Technically OT. Practically noise.
`min_overtime_minutes = 30` means OT is only recorded if it's ≥ 30 minutes.
Below that threshold — ignored, no OT logged.

---

### The Worked Hours Formula

```
STEP 1: Raw worked minutes
  raw_worked = checkout_time − checkin_time

  Special case (midnight crossing):
    if checkout_time < checkin_time:
      raw_worked = (checkout_time + 24 hours) − checkin_time

STEP 2: Deduct break
  net_worked = raw_worked − break_minutes

  Special case: if raw_worked < break_minutes
    net_worked = 0
    (employee didn't work long enough to have a full break)
    (break deduction cannot make worked time negative)

STEP 3: Regular minutes
  regular_minutes = (end_time − start_time) − break_minutes
  (the standard expected productive hours per shift)

STEP 4: OT minutes (if applicable)
  if net_worked > overtime_after_minutes:
    overtime_minutes = net_worked − regular_minutes
  else:
    overtime_minutes = 0
```

---

### Midnight Crossing Handling

This is where most attendance systems introduce bugs. The key insight:

```
Problem:
  Check-in:  22:20 (represented as 82,800 seconds from midnight)
  Check-out: 06:45 (represented as 24,300 seconds from midnight)

  Naive subtraction: 24,300 − 82,800 = −58,500 (NEGATIVE ❌)

Solution:
  Detect crossing: if checkout < checkin → midnight was crossed
  Adjust:          checkout_adjusted = checkout + 86,400 seconds
  Subtract:        checkout_adjusted − checkin = correct result

Concretely:
  Check-out adjusted: 06:45 + 24:00 = 30:45
  Worked raw:         30:45 − 22:20 = 08:25 = 505 minutes ✅
```

**How to detect if shift crosses midnight:**
Use the `crosses_midnight` boolean on the shift. Do not infer this from times alone — an admin could configure a 23:00 → 07:00 shift and a 22:00 → 22:30 short shift. The explicit flag removes ambiguity.

---

### All Status Definitions

```
Status              Meaning
─────────────────────────────────────────────────────────────
pending             Checked in, not yet checked out
present             Full day worked (net_worked ≥ half_day threshold)
late                Checked in after grace, but full day worked
                    (late is a FLAG, not a separate status —
                     combined with present: present + is_late = true)
half_day            Approved half day leave (leave balance −0.5)
half_day_early      Left early without approval, worked < half_day threshold
absent              Worked < absent_after_minutes OR never checked in
on_leave            Approved full day leave (leave balance −1)
holiday             Public holiday or org holiday (no attendance expected)
incomplete          Checkout missed outside grace window
regularisation_     Regularisation submitted, waiting for
  pending             manager approval
regularisation_     Manager approved, waiting for
  admin_pending       admin final approval
overtime            Flag on present record (not a separate status)
```

**Key distinction:**
`late` is never a standalone status. It is a **flag** (`is_late = true`) on a `present` record.

```
attendance.status = "present"
attendance.is_late = true
attendance.late_by_minutes = 30
```

This keeps status clean for payroll while preserving the late detail for HR reports.

---

### Scenario Walkthroughs

**Shift used for all scenarios:**
```
Start: 09:00 | End: 18:00 | Break: 60 min | Regular net: 480 min
Grace checkin: 15 min (late after 09:15)
Grace checkout: 60 min (valid until 19:00)
Half day threshold: 240 min
Absent threshold:   120 min
OT threshold:       480 min | Min OT: 30 min
```

---

**Scenario 1 — Perfect Day**
```
Check-in:   09:05 ✅ (within grace)
Check-out:  18:10 ✅ (within checkout grace)

Raw worked:  18:10 − 09:05 = 545 min
Net worked:  545 − 60 = 485 min

485 ≥ 480 (OT threshold)? YES — but OT = 485 − 480 = 5 min
5 < 30 (min_overtime) → OT not recorded

Result:
  status:           present
  is_late:          false
  overtime_minutes: 0
  check_out_type:   normal
```

---

**Scenario 2 — Late Arrival + Overtime**
```
Check-in:   09:45 ❌ (30 min past grace)
Check-out:  19:15 ✅ (within checkout grace)

Raw worked:  19:15 − 09:45 = 570 min
Net worked:  570 − 60 = 510 min

510 ≥ 480? YES — full day
OT = 510 − 480 = 30 min
30 ≥ 30 (min_overtime) → OT recorded

Result:
  status:           present
  is_late:          true
  late_by_minutes:  30
  overtime_minutes: 30
  check_out_type:   normal

Note: Employee was BOTH late AND did OT.
      Both flags recorded. Payroll policy
      (outside AttendEase scope) decides
      whether late deduction cancels OT pay.
```

---

**Scenario 3 — Early Checkout Without Approval**
```
Check-in:   09:10 ✅
Check-out:  13:30 (left early, no leave approval)

Raw worked:  13:30 − 09:10 = 260 min
Net worked:  260 − 60 = 200 min

200 ≥ 240 (half day)? NO
200 ≥ 120 (absent)?   YES

Result:
  status:           half_day_early
  is_late:          false
  check_out_type:   early
  overtime_minutes: 0
```

---

**Scenario 4 — Approved Half Day Leave**
```
Employee submitted half day leave (afternoon)
Admin approved

Check-in:   09:05 ✅
Check-out:  13:00

Raw worked:  13:00 − 09:05 = 235 min
Net worked:  235 − 30 (half break) = 205 min

Normally: 205 < 240 → would be half_day_early

BUT: leave_requests shows approved half day for today
  → status = half_day (approved)
  → leave balance deducted by 0.5
  → NOT flagged as early checkout ✅

Result:
  status:           half_day
  leave_deducted:   0.5
  is_late:          false
  check_out_type:   normal (approved departure)

Key difference from Scenario 3:
  half_day_early = left without approval (flagged)
  half_day       = approved (normal, leave deducted)
```

---

**Scenario 5 — Night Shift Midnight Crossing**
```
Shift: 22:00 → 06:00 | crosses_midnight = true
Break: 30 min | Regular net: 450 min

Check-in:   22:20 ✅ (within grace: 22:15)
Check-out:  06:45 (next day, within grace: 07:00)

Midnight detected: 06:45 < 22:20 → crossing
Adjusted checkout: 06:45 + 24:00 = 30:45
Raw worked:  30:45 − 22:20 = 08:25 = 505 min
Net worked:  505 − 30 = 475 min

475 ≥ 480 (OT)? NO — just under
475 ≥ 240 (half day)? YES → full day

Result:
  status:           present
  date:             March 5 (check-in date ← always)
  is_late:          true
  late_by_minutes:  5
  overtime_minutes: 0
```

---

**Scenario 6 — Checked In Too Late (Absent)**
```
Check-in:   16:50 (very late)
Check-out:  18:30

Raw worked:  18:30 − 16:50 = 100 min
Net worked:  100 − 0 (no full break possible) = 100 min

100 ≥ 120 (absent threshold)? NO

Result:
  status:  absent
  Note:    Employee physically came in but
           worked too few hours.
           Threshold is admin-configured —
           not a hardcoded rule.
```

---

## 3. Engine 2 — OT / Late / Half-Day Computation

### Late Calculation

```
is_late = checkin_time > (shift.start_time + grace_minutes_checkin)

late_by_minutes = checkin_time − (shift.start_time + grace_minutes_checkin)

Example:
  Shift start:  09:00
  Grace:        15 min → cutoff = 09:15
  Check-in:     09:45

  is_late = true
  late_by_minutes = 09:45 − 09:15 = 30 minutes
```

### Half Day vs Half Day Early

```
half_day:       leave_requests table has approved half day leave
                for this employee on this date
                → leave balance deducted by 0.5

half_day_early: no approved leave + net_worked < half_day threshold
                AND net_worked ≥ absent threshold
                → NO leave deduction
                → flagged for admin visibility
                → employee may submit regularisation
```

### Overtime Calculation

```
Preconditions (ALL must be true to record OT):
  1. net_worked > overtime_after_minutes
  2. overtime_minutes ≥ min_overtime_minutes
  3. Employee not already flagged absent for today
  4. Check-out was not auto-generated

overtime_minutes = net_worked − regular_minutes

Example:
  Regular minutes: 480
  Net worked:      530
  OT raw:          530 − 480 = 50 min
  Min OT:          30 min
  50 ≥ 30 → OT recorded: 50 minutes ✅
```

### Early Checkout Flag

```
is_early_checkout = checkout_time < shift.end_time

early_by_minutes = shift.end_time − checkout_time

This flag is stored separately from status.
An approved half day leave still sets:
  is_early_checkout = true
  early_by_minutes = X
  (informational — not used for penalty)

An unapproved early checkout sets:
  is_early_checkout = true
  check_out_type = "early"
  status → half_day_early or absent based on worked hours
```

### Break Time Deduction Rules

```
IF raw_worked ≥ break_minutes:
  net_worked = raw_worked − break_minutes
  (full break deducted)

IF raw_worked < break_minutes AND raw_worked > 0:
  net_worked = 0
  (worked less than a full break — extreme edge case)
  (admin review recommended)

IF raw_worked = 0:
  net_worked = 0
  (no work at all — checked in and out immediately)
```

---

## 4. Engine 3 — Status Transition State Machine

### Why the State Machine Exists

Without explicit transition rules, concurrent processes cause data corruption:

```
Example without state machine:

  09:27  Employee checks in   → status = "pending"
  17:00  Employee checks out  → status = "present" ✅
  17:02  Auto-absent job fires (delayed by server load)
         → Overwrites "present" with "absent" ❌

With state machine:

  Auto-absent job checks: current status = "present"
  Transition "present → absent" via auto-absent = BLOCKED
  Job skips this employee ✅
```

### All Valid Transitions

```
FROM              EVENT                         TO
──────────────────────────────────────────────────────────────
pending      → checkout happens            → present
pending      → checkout happens (late)     → present (is_late=true)
pending      → checkout before threshold   → half_day_early
pending      → checkout below absent       → absent
pending      → grace window expires        → incomplete
pending      → auto-absent fires           → absent
pending      → approved leave found        → on_leave (skip checkin)

incomplete   → employee regularises        → regularisation_pending
absent       → employee regularises        → regularisation_pending

regularisation_pending → manager rejects   → absent / incomplete
                                             (reverts to original)
regularisation_pending → manager approves  → regularisation_admin_pending

regularisation_admin_pending → admin rejects → absent / incomplete
regularisation_admin_pending → admin approves → present / half_day

present      → admin manual override       → half_day
present      → admin manual override       → absent
half_day     → admin manual override       → present
absent       → admin manual override       → present
incomplete   → admin manual override       → present / half_day / absent
```

### All Blocked Transitions

```
FROM              EVENT                         BLOCKED BECAUSE
──────────────────────────────────────────────────────────────
present      → auto-absent fires           Already finalised
present      → pending                     Cannot un-finalise
absent       → pending                     Cannot un-finalise
on_leave     → regularisation submitted    Leave already covers day
holiday      → any status change           Immutable system record
half_day     → auto-absent fires           Already finalised
incomplete   → auto-absent fires           Different incomplete path
regularisation_pending → checkout          Cannot checkout after regularisation
```

### Status Check Before Every Write

```
Before any status update, the service layer checks:

function isValidTransition(currentStatus, newStatus, triggeredBy) {
  const validTransitions = {
    'pending':   ['present', 'half_day_early', 'absent', 'incomplete', 'on_leave'],
    'incomplete': ['regularisation_pending'],
    'absent':    ['regularisation_pending'],
    'regularisation_pending': ['regularisation_admin_pending', 'absent', 'incomplete'],
    'regularisation_admin_pending': ['present', 'half_day', 'absent', 'incomplete'],
    'present':   ['half_day', 'absent'],     ← admin override only
    'half_day':  ['present'],                ← admin override only
    'on_leave':  [],                         ← no transitions
    'holiday':   [],                         ← no transitions
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}

If isValidTransition returns false → throw error, log attempt,
do NOT write to DB.
```

---

## 5. Engine 4 — Bull Queue Job Designs

### Job Registry

```
Queue Name              Job                    Trigger
──────────────────────────────────────────────────────────────
attendance_queue        auto_absent            Scheduled daily
                        checkout_grace_expiry  Dynamic (per check-in)
                        offline_sync           On reconnect

face_queue              face_enrollment        On enrollment request

notification_queue      shift_reminder         Cron (shift_start − 30min)
                        checkout_reminder      Dynamic (shift_end)
                        leave_status           On leave action

report_queue            report_generation      On export request
```

---

### Job 1 — Auto-Absent

**Design choice: one job per SHIFT per day (not per employee)**

```
Why per-shift not per-employee:
  Per-employee: 10,000 jobs created at midnight → noisy
  Per-shift:    One job per shift type queries all employees
                in that shift in one DB operation → clean
```

**When is it scheduled?**

```
Daily cron fires at: shift.start_time + absent_after_minutes

Example:
  Shift start:          09:00
  absent_after_minutes: 480
  Job fires at:         09:00 + 480 min = 17:00
```

**What the job checks before marking absent:**

```
For each employee in this shift:

CHECK 1: Is today a work day for this shift?
  shift.work_days includes today's day number?
  NO → skip this employee (e.g., Saturday for Mon-Fri shift)

CHECK 2: Is today a holiday?
  holidays table has record for today
  covering this org + this branch (or org-wide)?
  YES → skip entire job

CHECK 3: Does employee have approved leave today?
  leave_requests: emp_id + covers today + status = approved?
  YES → skip, will be marked on_leave instead

CHECK 4: Is employee active?
  employees.status = 'active'?
  NO → skip

CHECK 5: Does attendance record already exist for today?
  attendance: emp_id + date = today exists?
  YES → skip (checked in, possibly pending or already present)
  (handles race condition — checked in just before job fires)

All checks passed → mark absent
```

**Race condition prevention:**

```
The attendance table has:
UNIQUE(org_id, emp_id, date)

Auto-absent uses:
INSERT INTO attendance (...) VALUES (...)
ON CONFLICT (org_id, emp_id, date) DO NOTHING

If employee checked in between job schedule and job fire:
  → UNIQUE constraint fires
  → ON CONFLICT DO NOTHING
  → No duplicate, no overwrite ✅
  → Job silently skips ✅
```

---

### Job 2 — Checkout Grace Expiry

**Scheduled dynamically at check-in time:**

```
Employee checks in at 09:27
Shift end:     18:00
Grace minutes: 60

Job scheduled for: 18:00 + 60 min = 19:00
Job payload: {
  empId:        "uuid",
  orgId:        "uuid",
  attendanceId: "uuid",
  shiftId:      "uuid",
  scheduledAt:  "2026-03-05T13:00:00Z"
}

Job ID stored in attendance record:
  attendance.checkout_grace_job_id = bull_job_id
```

**Cancellation when employee checks out normally:**

```
Employee checks out at 17:45 (within grace window)
  ↓
Backend:
  jobId = attendance.checkout_grace_job_id
  job = await checkoutGraceQueue.getJob(jobId)
  if (job) await job.remove()
  ← Job cancelled ✅ — will never fire
```

**What happens when job fires (employee missed checkout):**

```
Job fires at 19:00 — no checkout detected
  ↓
1. UPDATE attendance SET status = 'incomplete'
2. Send FCM push to employee:
   "You haven't checked out today. Submit a
    regularisation request if you need assistance."
3. Send notification to admin:
   "[Employee Name] missed checkout today."
4. Log in audit_logs
5. Regularisation window now open for employee
```

---

### Job 3 — Face Enrollment

```
Trigger:  POST /face/enroll (employee submits selfie)
Priority: Low (runs in off-peak hours)
Rate:     Max 10 enrollments/second (Bull rate limiter)

Job payload: {
  empId:             "uuid",
  orgId:             "uuid",
  cloudinaryUrl:     "https://...",
  enrollmentAttempt: 1
}

Job steps:
  1. Check: is employee already enrolled?
     (idempotency — skip if already enrolled)
  
  2. Download image from Cloudinary

  3. On-server quality check:
     (backup check — ML Kit should have caught issues)

  4. TensorFlow.js → generate 128D embedding
     Store: employees.face_embedding_local = [...]

  5. AWS Rekognition IndexFaces
     Store: employees.face_embedding_id = "aws-face-id"

  6. Mark enrolled:
     employees.is_face_enrolled = true
     employees.enrolled_at = NOW()

  7. Delete image from Cloudinary
     (not needed after enrollment — reduce storage cost)

  8. Send FCM: "Face recognition setup complete"

On failure:
  Retry 1: after 30 seconds
  Retry 2: after 2 minutes
  Retry 3: after 10 minutes
  After 3 failures → dead letter queue
    employees.enrollment_status = 'failed'
    FCM: "Face setup failed. Please try again."
    Admin notified
```

---

### Job 4 — Scheduled Notifications

```
Shift reminder (cron per shift):
  Fires at: shift.start_time − 30 minutes
  Sends to: all employees with no check-in yet today
  Message:  "Your shift starts in 30 minutes"

Checkout reminder (dynamic, per check-in):
  Fires at: shift.end_time
  Sends to: employee who checked in (if not checked out)
  Message:  "Don't forget to check out"
  Cancel:   When employee checks out ← same cancel pattern as Job 2
```

---

### Job 5 — Report Generation

```
Trigger:  POST /reports/export
Purpose:  Heavy DB queries run async — not on main API thread

Job steps:
  1. Execute report query (may scan millions of rows)
  2. Format as CSV
  3. Upload CSV to Cloudinary
  4. Send email with download link (24hr expiry)
  5. Mark job complete

Idempotency key: jobId (prevents double email if job retries)
```

---

### Job 6 — Attendance Offline Sync

```
Trigger:  POST /attendance/sync (mobile, on reconnect)
Purpose:  Process queued offline check-ins

For each offline record in order of timestamp:

  1. Verify refreshTokenHash matches DB
     (confirms token was valid at time of offline checkin)
     FAIL → reject this record, log security event

  2. Check for conflict:
     Does attendance record exist for emp_id + date?

     NO CONFLICT:
       → Create attendance record normally
       → source = 'offline_sync'

     CONFLICT — existing status = 'auto_absent':
       → Check: is offline timestamp within shift window?
       YES → Override:
             UPDATE attendance SET
               status = computed_status,
               check_in_time = offline_timestamp,
               source = 'offline_sync',
               auto_absent_overridden = true
             Notify admin of override
       NO  → Reject (timestamp outside valid window)

     CONFLICT — existing status != 'auto_absent':
       → Reject (manual record or legitimate absence)
       → Log conflict, notify employee

  3. Idempotency:
     Each offline record has client_record_id (UUID)
     generated on the phone at time of offline checkin
     INSERT ... ON CONFLICT (client_record_id) DO NOTHING
     ← Prevents duplicate if sync fires twice
```

---

### Idempotency — The Non-Negotiable Rule

Bull Queue guarantees **at-least-once** delivery. Not exactly-once.

```
What this means:
  A job runs successfully.
  Network issue → Bull is unsure if it completed.
  Bull runs it again.

Without idempotency:
  Auto-absent fires twice   → two absent records ❌
  Face enrollment fires twice → two AWS calls, duplicate ❌
  Report generates twice    → two emails ❌

Every job must ask: "Has this already been done?"
before doing anything.
```

**Idempotency strategy per job:**

```
Job                  Idempotency Mechanism
─────────────────────────────────────────────────────────
auto_absent          UNIQUE(org_id, emp_id, date) + ON CONFLICT DO NOTHING
checkout_grace       Check attendance.status before updating
face_enrollment      Check employees.is_face_enrolled before processing
offline_sync         UNIQUE(client_record_id) + ON CONFLICT DO NOTHING
report_generation    Job ID used as idempotency key in report_jobs table
notifications        Dedup by (emp_id + notification_type + date) in Redis
```

---

### Dead Letter Queue Strategy

```
When a job fails all retries → moves to dead letter queue

Dead letter queue actions:
  1. Log full error stack trace
  2. Log job payload
  3. Alert admin via email/notification
  4. Mark related record with failed status

Dead letter queues per job type:
  face_enrollment_dlq → enrollment_status = 'failed'
  auto_absent_dlq     → manual review required, admin alerted
  report_dlq          → email user "report failed, please retry"
  sync_dlq            → log conflict, employee must regularise

Bull-board dashboard shows all DLQ items in real time.
Admin can:
  → Retry a failed job
  → Discard it with reason
  → View full error log
```

---

## 6. Engine 5 — Regularisation Flow

### Why Two-Level Approval

```
Single admin approval risk:
  Employee and admin are friendly
  Admin approves without verification
  Pattern repeats monthly → payroll fraud undetected

Two-level approval:
  Manager approves first (knows employee's actual schedule)
  Admin approves second (financial authority)
  Both must collude for fraud → significantly harder
  Both approvals permanently visible in audit logs
```

### The Complete Regularisation Flow

```
EMPLOYEE
  Submits regularisation request:
  {
    attendanceId:       "uuid",
    requestedCheckIn:   "2026-03-04T09:00:00Z",
    requestedCheckOut:  "2026-03-04T18:00:00Z",
    reason:             "Was in client meeting, forgot to check in",
    evidenceType:       "meeting_invite"  ← mandatory field
  }
         ↓
  attendance.status → "regularisation_pending"
         ↓
MANAGER NOTIFICATION
  FCM + in-app: "[Employee] submitted regularisation for Mar 4"
  Manager sees: requested times, reason, evidence type
         ↓
  Manager rejects?
    → attendance reverts to original status
    → Employee notified with rejection reason
    → Regularisation closed

  Manager approves?
    → status → "regularisation_admin_pending"
         ↓
ADMIN NOTIFICATION
  FCM + in-app: "Regularisation approved by manager — needs your review"
         ↓
  Admin rejects?
    → attendance reverts to original status
    → Employee notified

  Admin approves?
    → Shift engine recomputes worked hours
      with new check-in/check-out times
    → status → computed (present / half_day / absent)
    → Audit log entry: {
        action: "regularisation.approved",
        approvedBy: admin_id,
        managerApprovedBy: manager_id,
        originalStatus: "incomplete",
        newStatus: "present",
        reason: "..."
      }
    → Employee notified ✅
```

### Anti-Misuse Architecture

```
Layer 1: Evidence Requirement
  evidenceType field is mandatory — cannot submit without it
  Options: meeting_invite | client_email | manager_confirmation | other
  "other" type is flagged for extra scrutiny in admin view

Layer 2: Frequency Visibility (V2 — planned)
  Employee's regularisation count visible on their profile
  HR can see: "Rahul has submitted 8 regularisations this year"
  Triggers manual review if count is high

Layer 3: Two-Level Approval
  Described above — dual sign-off required

Layer 4: Permanent Audit Trail
  Every regularisation, every approval, every rejection
  stored in audit_logs — immutable, visible to Super Admin
  Cannot be deleted by org admin
```

### Regularisation State Machine

```
FROM                              EVENT           TO
──────────────────────────────────────────────────────────
absent/incomplete            → submitted     → reg_pending
reg_pending                  → mgr rejects   → absent/incomplete
reg_pending                  → mgr approves  → reg_admin_pending
reg_admin_pending            → admin rejects → absent/incomplete
reg_admin_pending            → admin approves → present/half_day

BLOCKED:
on_leave        → cannot regularise (leave covers the day)
holiday         → cannot regularise (immutable)
present         → cannot regularise (already finalised positively)
reg_pending     → cannot submit another (one at a time per record)
```

---

## 7. The Complete Attendance Pipeline

```
EMPLOYEE TAPS CHECK IN
  ↓
Face verification (see FACE_RECOGNITION_README.md)
  ↓
Location verification (see LOCATION_STRATEGY_README.md)
  ↓
Create attendance record:
  status = "pending"
  check_in_time = now
  date = today
  source = "self"
  ↓
Schedule Bull jobs:
  checkout_reminder → fires at shift.end_time
  checkout_grace_expiry → fires at shift.end_time + grace
  ↓
Return 200 to employee
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(time passes — employee works)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE TAPS CHECK OUT
  ↓
Face verification (lighter — cached if within session)
  ↓
Location verification
  ↓
Cancel: checkout_reminder job
Cancel: checkout_grace_expiry job
  ↓
Compute:
  raw_worked = checkout − checkin (midnight handled)
  net_worked = raw_worked − break_minutes
  is_late = checkin > start + grace
  late_by_minutes = computed
  is_early_checkout = checkout < shift_end
  overtime_minutes = computed (if applicable)
  ↓
State machine check:
  isValidTransition("pending", computed_status) → must be true
  ↓
Check leave_requests:
  approved half day today? → status = "half_day"
  approved full day today? → status = "on_leave"
  neither → compute from worked hours
  ↓
UPDATE attendance:
  status = computed
  check_out_time = now
  worked_minutes = net_worked
  is_late, late_by_minutes
  is_overtime, overtime_minutes
  is_early_checkout
  check_out_type = "normal"
  ↓
Emit Socket.io event → live board updates in real time
  ↓
Return 200 to employee ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF EMPLOYEE NEVER CHECKS OUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
checkout_grace_expiry job fires
  ↓
UPDATE attendance SET status = "incomplete"
  ↓
Push notification to employee
Notification to admin
  ↓
Employee submits regularisation → two-level approval flow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF EMPLOYEE NEVER CHECKS IN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
auto_absent job fires at shift_start + absent_after_minutes
  ↓
Run all 5 precondition checks
  ↓
INSERT attendance (status = "absent")
ON CONFLICT DO NOTHING ← race condition safe
  ↓
Admin notified of absent employees
Employee can submit regularisation
```

---

## 8. Database Fields Reference

### attendance table — LLD-relevant fields

```sql
id                      UUID PK
org_id                  UUID FK
emp_id                  UUID FK
date                    DATE          ← check-in date, always
check_in_time           TIMESTAMPTZ
check_out_time          TIMESTAMPTZ
status                  VARCHAR(30)   ← see status definitions
worked_minutes          INTEGER       ← net worked after break deduction
break_minutes_applied   INTEGER       ← actual break deducted
is_late                 BOOLEAN
late_by_minutes         INTEGER
is_overtime             BOOLEAN
overtime_minutes        INTEGER
is_early_checkout       BOOLEAN
early_by_minutes        INTEGER
check_out_type          VARCHAR(20)   ← normal|early|late|auto|admin_override
source                  VARCHAR(20)   ← self|auto|admin|offline_sync|regularisation
auto_absent_overridden  BOOLEAN       ← true if offline sync overrode auto-absent
location_accuracy_flagged BOOLEAN
face_match_score        DECIMAL(4,3)
face_match_source       VARCHAR(10)   ← local|aws
checkout_grace_job_id   VARCHAR(100)  ← Bull job ID for cancellation
client_record_id        UUID          ← offline sync idempotency key
synced_at               TIMESTAMPTZ   ← when offline record was synced

UNIQUE(org_id, emp_id, date)          ← race condition prevention
```

### regularisations table — LLD-relevant fields

```sql
id                      UUID PK
org_id                  UUID FK
emp_id                  UUID FK
attendance_id           UUID FK
requested_check_in      TIMESTAMPTZ
requested_check_out     TIMESTAMPTZ
reason                  TEXT
evidence_type           VARCHAR(30)
status                  VARCHAR(30)   ← pending|manager_approved|approved|rejected
manager_id              UUID FK       ← who is the manager
manager_action          VARCHAR(10)   ← approved|rejected
manager_actioned_at     TIMESTAMPTZ
manager_remarks         TEXT
admin_id                UUID FK
admin_action            VARCHAR(10)
admin_actioned_at       TIMESTAMPTZ
admin_remarks           TEXT
created_at              TIMESTAMPTZ
```

---

## 9. Configuration Reference

### Shift Thresholds — Recommended Defaults

```
Field                     Recommended Default   Notes
─────────────────────────────────────────────────────────────────
grace_minutes_checkin     15                    After this = late
grace_minutes_checkout    60                    After this = incomplete
half_day_after_minutes    240                   4 hours worked = half day
absent_after_minutes      120                   2 hours worked = absent
overtime_after_minutes    480                   8 hours = standard day
min_overtime_minutes      30                    Below this OT ignored
break_minutes             60                    Standard 1 hour lunch
```

All are admin-configurable per shift. These are starting defaults only.

### Attendance Source Values

```
"self"           Employee checked in/out via app normally
"auto"           Auto-absent marked by Bull Queue
"admin"          Admin manually created/edited record
"offline_sync"   Created from offline queue on reconnect
"regularisation" Status updated via approved regularisation
```

---

## 10. Edge Cases Registry

| Edge Case | Handling |
|---|---|
| Check-in exactly at shift start | On time (not late — boundary is inclusive) |
| Check-in exactly at grace cutoff | On time (cutoff is inclusive) |
| Check-out exactly at grace end | Valid (grace end is inclusive) |
| Midnight crossing with break spanning midnight | Break deducted from raw total regardless |
| Auto-absent fires while employee is checking in | UNIQUE constraint + ON CONFLICT DO NOTHING |
| Two regularisation requests for same day | Blocked — only one pending per attendance record |
| Employee checks out before checking in | Blocked at API level — ATT_002 error |
| Shift duration less than break_minutes | break_minutes capped at shift duration |
| Holiday + employee checks in anyway | Attendance recorded, status = present, holiday flag noted |
| Leave approved but employee comes in | Leave cancelled if employee checks in? → Admin decides policy |
| Night shift employee checked in March 5, auto-absent for March 5 fires | UNIQUE constraint prevents duplicate |
| Offline sync arrives after regularisation already approved | Rejected — record already finalised positively |
| Admin changes shift config after employees enrolled | Takes effect next day only — existing pending records use original config |

---

## 11. Glossary

| Term | Definition |
|---|---|
| **Bull Queue** | Redis-backed job queue for Node.js — guarantees at-least-once job execution |
| **Idempotency** | Property where running an operation multiple times produces the same result as running it once |
| **Dead Letter Queue** | Queue where failed jobs land after all retries are exhausted |
| **State Machine** | A design pattern where an entity (attendance record) can only move between explicitly defined states via explicitly defined transitions |
| **Race Condition** | A bug where two operations happen simultaneously and interfere with each other |
| **ON CONFLICT DO NOTHING** | PostgreSQL syntax that silently skips an INSERT if it would violate a UNIQUE constraint |
| **Crosses Midnight** | A shift that starts on one calendar day and ends on the next |
| **Regularisation** | A formal request by an employee to correct a past attendance record |
| **Two-Level Approval** | Requiring both manager and admin sign-off — prevents single point of collusion |
| **Grace Period** | A configurable buffer window allowing late check-ins or late check-outs without penalty |
| **Net Worked Minutes** | Raw worked minutes minus break time deduction |
| **Auto-Absent** | System-initiated absent marking triggered when no check-in is detected by the absent threshold |
| **Offline Sync** | Process of uploading locally queued check-in events when internet is restored |
| **Client Record ID** | A UUID generated on the phone at offline check-in time — used to prevent duplicate sync processing |
| **Checkout Grace Job** | A Bull Queue job scheduled at check-in time that fires if no checkout occurs within the grace window |
| **Evidence Type** | A mandatory field in regularisation requests — categorises the supporting reason |
| **Bull-board** | A web UI for monitoring Bull Queue jobs — shows waiting, active, completed, and failed jobs |

---

*AttendEase LLD — Internal Engineering Document*
*Previous: JWT + Auth Flow | Next: Multi-Tenancy Deep Dive*

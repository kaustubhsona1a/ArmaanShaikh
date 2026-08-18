# SECURITY SPECIFICATION: THE JACKPOT CARS

This specification details the attribute-based access control (ABAC) and zero-trust policies protecting the Firestore data layer of the Jackpot Cars luxury dealership portal.

## 1. Data Invariants & Access Matrix

| Collection | Create | Read (Get) | Read (List) | Update | Delete |
|---|---|---|---|---|---|
| `/vehicles/{id}` | `isAdmin()` | Public | Public | `isAdmin()` | `isAdmin()` |
| `/inventory_meta/current` | `isAdmin()` | Public | Public | `isAdmin()` | `isAdmin()` |
| `/site_config/current` | `isAdmin()` | Public | Public | `isAdmin()` | `isAdmin()` |
| `/leads/{id}` | Public | `isAdmin()` | `isAdmin()` | `isAdmin()` | `isAdmin()` |
| `/reviews/{id}` | `isAdmin()` | Public | Public | `isAdmin()` | `isAdmin()` |
| `/admins/{uid}` | `isAdmin()` | `isAdmin() \|\| isOwner()` | `isAdmin()` | `isAdmin()` | `isAdmin()` |

### Key System Invariants
- **Vehicle Integrity**: No client can create or change vehicle prices, specifications, or details unless explicitly authenticated as an active Admin.
- **Lead Protection**: Public customers can submit (`create`) a purchase inquiry lead, but they cannot read, list, update, or delete any leads. Only authenticated Admins may read/update/delete leads.
- **Admin Privilege Escapes**: Admins must have their UIDs declared in the `/admins/` collection or have the verified owner email `kaustubhsona1a@gmail.com` on their Google Account token.

---

## 2. The Golden Dozen Threat Payloads (The "Dirty Dozen")

The following payloads attempt to probe or poison the Firestore database, and must return `PERMISSION_DENIED`:

### Payload Index
1. **Unauthenticated Vehicle Seeding**
   - *Attack*: Threat actor attempts to write a fake Bentley into `/vehicles/bad-id-1` without signing in.
   - *Assert*: Rejected.

2. **Privilege Escalation (Admin Self-Creation)**
   - *Attack*: Signed-in non-admin attempts to designate their own UID as an admin in `/admins/{uid}`.
   - *Assert*: Rejected.

3. **Public Lead Scraping (List Attack)**
   - *Attack*: Public customer invokes a collection scan `getDocs` on `/leads` to capture competitor contact info.
   - *Assert*: Rejected.

4. **Malicious ID Hijacking (Resource Poisoning)**
   - *Attack*: Admin/Attacker uses a 1MB string or high-byte UTF-8 injection as `{vehicleId}` to cause billing bloating.
   - *Assert*: Rejected via `isValidId()` guard.

5. **Client-Timing Tampering**
   - *Attack*: Attacker provides a spoofed historical timestamp string `createdAt` on vehicle listing to override natural temporal order.
   - *Assert*: Rejected (`incoming().createdAt == request.time`).

6. **Lead Modification (Update Attack)**
   - *Attack*: Threat actor attempts to update the status of `leads/lead1` from "New Lead" to "Negotiating" or deletes their phone number.
   - *Assert*: Rejected (Only admin can update).

7. **Site Branding Overwrite**
   - *Attack*: Attacker attempts to change the dealership's primary Logo in `/site_config/current` to deface the homepage.
   - *Assert*: Rejected.

8. **Shadow Field Injection**
   - *Attack*: Attacker posts a vehicle payload containing a hidden `ghostField` property attempting to crash serialization parsers.
   - *Assert*: Rejected via strict `hasAll` and exact length bounds.

9. **Terminal State Bypass**
   - *Attack*: Non-admin modifies a lead that reached "Archived" status back to "New Lead".
   - *Assert*: Rejected.

10. **Negative Value / Type Spoofing**
    - *Attack*: Posting negative year or string to numeric field `price` to break frontend calculators.
    - *Assert*: Rejected via `is number` and boundary guards.

11. **Metadata Manipulation**
    - *Attack*: Attacker changes `inventory_meta/current` value directly to bypass clean cache sync loops.
    - *Assert*: Rejected.

12. **Vehicle Deletion by Public User**
    - *Attack*: Attacker requests deletion of `/vehicles/v1`.
    - *Assert*: Rejected.

---

## 3. Test Script Framework (`firestore.rules.test.ts`)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

// The Fortress validation unit tests run directly in secure emulation testing:
describe("Jackpot Cars - Fortress Security Rules", () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ai-studio-f242a522-18ce-4e86-a5ae-6d3303a369eb",
      firestore: {
        rules: `rules_version = '2'; ...`,
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("should block unauthenticated vehicle creations", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.doc("vehicles/test-car").set({ make: "Fake" }));
  });

  it("should prevent public users from listing or viewing leads", async () => {
    const publicDb = testEnv.authenticatedContext("user123").firestore();
    await assertFails(publicDb.collection("leads").get());
  });

  it("should enforce server timestamp checks on admin actions", async () => {
    const adminDb = testEnv.authenticatedContext("adminId", { email: "kaustubhsona1a@gmail.com" }).firestore();
    await assertFails(adminDb.doc("vehicles/v9").set({
      id: "v9",
      make: "Audi",
      model: "R8",
      variant: "V10 Plus",
      year: 2021,
      price: 15400000,
      status: "Available",
      createdAt: new Date("2020-01-01"), // Defeated by server timestamp enforcement
    }));
  });
});
```

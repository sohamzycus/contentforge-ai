# Specification: [FEATURE_NAME]

> **Constitution Version:** 1.0.0
> **Author:** [AUTHOR]
> **Date:** [ISO_DATE]
> **Status:** Draft | Review | Approved

---

## Overview

**Problem:** [What problem does this solve?]

**Solution:** [High-level approach]

**Success Criteria:**
1. [CRITERION_1]
2. [CRITERION_2]
3. [CRITERION_3]

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-01 | [REQUIREMENT] | Must | |
| FR-02 | [REQUIREMENT] | Should | |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Response time | < [X]ms for [OPERATION] |
| NFR-02 | Security | [CONSTRAINT] |

---

## API Contract

### Endpoints

```
[METHOD] /api/[RESOURCE]
```

**Request:**
```json
{
  "field": "type — description"
}
```

**Response (200):**
```json
{
  "field": "type — description"
}
```

---

## Data Model Changes

| Table | Column | Type | Change |
|-------|--------|------|--------|
| [TABLE] | [COLUMN] | [TYPE] | Add / Modify / Remove |

---

## UI/UX

[Describe user-facing changes, reference design system tokens from Constitution Section 8.3]

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| [EDGE_CASE_1] | [BEHAVIOR] |
| [EDGE_CASE_2] | [BEHAVIOR] |

---

## Dependencies

- [ ] [DEPENDENCY_1] — [JUSTIFICATION per Constitution Section 3.2]

---

## Open Questions

1. [QUESTION_1]

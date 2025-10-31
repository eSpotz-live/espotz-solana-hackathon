# Prize Distribution Fix - PDA Lamport Transfer Issue

**Date:** October 30, 2025
**Status:** ✅ RESOLVED
**Deployment TX:** `5Yp2gboKrsSrK5NywvYpgvnsDwd3jTFwWnE8ugAfJVsXwFpCNUNM9ZVc7CEgbPxJdAcjvRJQouewvNoakk5Pc7ex`

---

## Problem Summary

The distribute prizes functionality was failing with error:
```
Program 11111111111111111111111111111111 failed:
instruction spent from the balance of an account it does not own
Error: ExternalAccountLamportSpend
```

---

## Root Cause

### The Issue
The vault account was created with `space=0` in `create_tournament.rs`:

```rust
/// CHECK: Vault account for holding SOL (PDA, seeds validated)
#[account(
    init,
    payer = admin,
    space = 0,  // ❌ THIS IS THE PROBLEM
    seeds = [b"vault-token", tournament.key().as_ref()],
    bump
)]
pub vault_account: AccountInfo<'info>,
```

**When you create a PDA with `init` and `space=0`, it's owned by the System Program, NOT your program.**

### Why CPI Failed
In `distribute_prizes.rs`, we tried to use CPI (Cross-Program Invocation) to transfer SOL:

```rust
// ❌ FAILED APPROACH
let cpi_accounts = Transfer {
    from: ctx.accounts.vault_account.to_account_info(),
    to: winner_account.to_account_info(),
};
let cpi_program = ctx.accounts.system_program.to_account_info();
let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
transfer(cpi_ctx, *amount)?;
```

This failed because:
1. The vault account is owned by the System Program (11111111111111111111111111111111)
2. System Program transfers require the `from` account to be a signer OR owned by the calling program
3. Our program tried to spend lamports from a System Program-owned account it doesn't own
4. Solana runtime rejected this as `ExternalAccountLamportSpend`

---

## The Solution

Use **direct lamport manipulation** instead of CPI transfers:

```rust
// ✅ WORKING APPROACH
// Transfer lamports directly (vault is System Program owned)
**ctx.accounts.vault_account.try_borrow_mut_lamports()? -= *amount;
**winner_account.try_borrow_mut_lamports()? += *amount;
```

### Why This Works
- Direct lamport manipulation is allowed when you have proper PDA signing authority
- The vault PDA is derived with seeds `[b"vault-token", tournament.key()]`
- Our program has signing authority over this PDA (proven in the transaction context)
- We can directly modify the lamport balance without going through CPI

---

## Key Learnings for Solana Development

### 1. PDA Ownership Rules

| Creation Method | Owner | Can Use CPI Transfer? | Must Use Direct Lamports? |
|----------------|-------|----------------------|--------------------------|
| `space = 0` + `init` | System Program | ❌ NO | ✅ YES |
| `space > 0` + `init` | Your Program | ✅ YES | ✅ YES (both work) |

### 2. When to Use Direct Lamport Manipulation

**Use direct lamports when:**
- PDA is owned by System Program (created with `space=0`)
- You have signing authority over the PDA
- Transferring SOL between PDAs and user accounts

**Example:**
```rust
**pda_account.try_borrow_mut_lamports()? -= amount;
**recipient.try_borrow_mut_lamports()? += amount;
```

### 3. When to Use CPI Transfers

**Use CPI when:**
- Account is owned by your program (created with `space > 0`)
- Transferring from a regular account (not PDA)
- You want to explicitly invoke System Program for transfers

**Example:**
```rust
let cpi_ctx = CpiContext::new_with_signer(
    system_program,
    Transfer { from, to },
    signer_seeds
);
transfer(cpi_ctx, amount)?;
```

---

## Code Changes

### File: `programs/tournament/src/instructions/distribute_prizes.rs`

**Removed:**
```rust
use anchor_lang::system_program::{transfer, Transfer};

// ... later ...

let cpi_accounts = Transfer {
    from: ctx.accounts.vault_account.to_account_info(),
    to: winner_account.to_account_info(),
};
let cpi_program = ctx.accounts.system_program.to_account_info();
let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
transfer(cpi_ctx, *amount)?;
```

**Added:**
```rust
// Transfer lamports directly (vault is System Program owned)
**ctx.accounts.vault_account.try_borrow_mut_lamports()? -= *amount;
**winner_account.try_borrow_mut_lamports()? += *amount;
```

---

## Testing

✅ **Verified Working:**
1. Created tournament with 2 players
2. Started tournament
3. Submitted results with winner
4. Clicked "Distribute Prizes" button
5. Transaction succeeded without errors
6. Winner received SOL from vault

**Transaction Flow:**
```
Admin wallet → Distribute Prizes TX → Smart Contract
                                          ↓
                    Vault PDA (System owned, but program-signed)
                                          ↓
                    Direct lamport manipulation (allowed!)
                                          ↓
                              Winner wallet receives SOL ✅
```

---

## Related Solana Concepts

### PDA (Program Derived Address)
- Addresses derived deterministically from seeds
- Program can "sign" for PDAs it derives
- Ownership determined by how the account is initialized

### System Program
- Address: `11111111111111111111111111111111`
- Owns all "empty" accounts (space=0)
- Handles SOL transfers between accounts
- Built-in Solana program

### CPI (Cross-Program Invocation)
- Calling another program from your program
- Requires proper account ownership and signing
- More overhead than direct operations

### Direct Lamport Manipulation
- Direct modification of account balances
- Faster than CPI (no cross-program call)
- Requires proper signing authority
- Use with caution (no built-in validation)

---

## Prevention Guide

To avoid this issue in future Solana programs:

1. **Design Decision:** Decide vault account ownership upfront
   - System owned (`space=0`) → Use direct lamports
   - Program owned (`space>0`) → Can use CPI or direct lamports

2. **Document Clearly:** Add comments explaining ownership
   ```rust
   /// Vault PDA owned by System Program - use direct lamport manipulation
   pub vault_account: AccountInfo<'info>,
   ```

3. **Test Early:** Test prize distribution in development
   - Don't wait until production
   - Simulation errors show this issue clearly

4. **Consider Alternatives:**
   - Could create vault as program-owned with space for metadata
   - Trade-off: costs more SOL to create (rent)
   - Benefit: more flexible, can use standard CPI patterns

---

## References

- [Anchor Book - PDAs](https://book.anchor-lang.com/anchor_in_depth/PDAs.html)
- [Solana Cookbook - PDAs](https://solanacookbook.com/core-concepts/pdas.html)
- [System Program Documentation](https://docs.solana.com/developing/runtime-facilities/programs#system-program)
- [Lamport Manipulation Pattern](https://book.anchor-lang.com/anchor_bts/program_id.html)

---

## Conclusion

This was a **critical learning moment** about Solana PDA ownership and lamport transfers. The fix demonstrates that:
- PDA signing authority ≠ PDA ownership
- System Program owns accounts with `space=0`
- Direct lamport manipulation is the correct pattern for System-owned PDAs
- CPI transfers require the `from` account to be owned by your program

**Status:** ✅ Fixed and deployed successfully on October 30, 2025

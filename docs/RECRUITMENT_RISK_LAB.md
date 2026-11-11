# Recruitment risk lab

The admin risk lab is an educational, deterministic simulation. It generates no participant records and never reads or writes live affiliate balances, commissions, payouts, payment records, or customer funds.

## Model assumptions

- Every simulated participant contributes the configured virtual KES amount.
- The user can model 0–8 additional generations, 0–5 direct recruits per participant, and 1–100 starting participants.
- Four fixed illustrative reward shares are applied to the nearest four upline generations: 40%, 25%, 20%, and 15%. They are fixed in code and are not an enabled programme or payout configuration.
- Simulated operating costs are fixed at 12% of modeled contributions.
- External product revenue, withdrawals, refunds, taxes, inactive participants, and real-world transfer costs are set to zero or omitted. The model therefore is not a full forecast.
- All arithmetic uses integer minor KES units and deterministic integer truncation.

The response reports contribution inflows, commission obligations, operating costs, virtual funds remaining/deficit, and cohort net positions. Each run is audit logged with its inputs and aggregate outputs. This model does not store or generate contacts, accounts, referral codes, or real transactions.

There is no route from this simulator to registration, Daraja, Airtel, or payout providers. Do not use its output as a product offer, earnings claim, or financial advice.

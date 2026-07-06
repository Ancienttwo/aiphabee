# Product Spec: AiphaBee

> **Status**: Draft
> **Last Updated**: 2026-06-20 02:07
> **Owner**: Planner

## Product Outcome

Describe the stable user or operator outcome this repo should deliver.

## Success Criteria

- Primary workflow:
- Quality bar:
- Out of scope:

## Constraints

- Technical:
- Compliance:
- Delivery:

## Ephemeral Public OHLCV Technical Analysis

`technical_analysis_ephemeral` is the capability for user-initiated public OHLCV
technical analysis. Its runtime skill entrypoint is
`analyze_public_technical_signal`, and its output data classification is
`public_observation_signal`.

This capability is bounded to one user-requested symbol per run and at most 500
bars. Raw OHLCV may enter bounded LLM context and may be displayed to the user,
but it must not be written to AiphaBee market database storage or shared cache.
The default chat transcript policy is `temporary_only`.

`get_price_history` is not this skill entrypoint. It remains a separate
price-history scaffold and must not be reused as the public OHLCV
technical-analysis skill.

The skill is Research Agent only. Generic Agent requests are denied, and
Research Agent requests require `user_initiated=true`. Provider output is never
an authorized or verified market-data feed; provider output must be normalized
before use.

## Acceptance Scenarios

- Given
  When
  Then

## Open Questions

- ...

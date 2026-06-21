# Task Replay Mode Release Gate Scaffold Contract

## Scope

Sprint 3.3 §19.2: `长任务可恢复；保存报告可重放；新手/专业模式不改口径`.

## Runtime Surfaces

- Agent runtime capability:
  `GET /agent/runtime` -> `task_replay_mode_release_gate`
- Release gate route:
  `POST /agent/release-gates/task-replay-mode/plan`
- Linked existing routes:
  `POST /agent/workflows/tasks/plan`,
  `POST /research/runs/save/plan`,
  `POST /research/runs/replay/plan`,
  `POST /agent/runs/plan`

## Required Checks

- `long_task_returns_task_id_and_resume_handle`
- `long_task_checkpoint_state_is_disconnect_safe`
- `saved_report_has_deterministic_replay_seed`
- `replay_preserves_old_report_snapshot`
- `newbie_professional_depth_preserves_data_contract`
- `mode_switch_changes_presentation_only`

## Persistence Scaffold

- `core.task_replay_mode_release_gate`
- `governance.task_replay_mode_release_gate_contract`

## Explicit Non-Goals

- Live Workflow execution.
- Live replay job execution.
- Frontend mode switch release UI.
- Live DB/Queue writes, model calls, or tool execution.

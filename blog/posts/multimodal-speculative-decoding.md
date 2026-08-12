## Experiment setup

Scope: **image + text → text**, single image, over MMSpec's six topics, in column order:

<div class="taglist">
<span class="tag tag--gqa">GQA</span>
<span class="tag tag--textvqa">TextVQA</span>
<span class="tag tag--caption">Image Captioning</span>
<span class="tag tag--chartqa">ChartQA</span>
<span class="tag tag--reasoning">Complex Reasoning</span>
<span class="tag tag--multiturn">Multi-Turn Conversation</span>
</div>

### Metrics

- **Average acceptance length ($\tau$)** — hardware-independent, the algorithmic quantity.
- **Wall-clock speedup at batch 1**, paired with the output-length distribution.
- **Throughput across a batch sweep** — MMSpec finds vision awareness matters more at
  larger batch, and that throughput speedup does not track latency.
- **Losslessness** — confirm the target's output distribution is preserved.

**Table 1.** Method taxonomy.

| Method | Exact verification | Offline training | Extra learned params | Separate draft model | Vision-conditioned proposal | Released checkpoint |
| :----- | :---: | :---: | :---: | :---: | :--- | :--- |
| EAGLE-1 / -2 / -3 | ✓ | ✓ | ✓ | ✓ | Checkpoint-dependent | Qwen / LLaVA |
| Medusa-exact | ✓ | ✓ | ✓ | ✗ | Indirect, via target state | Qwen / LLaVA |
| Medusa-typical | ✗ | ✓ | ✓ | ✗ | Indirect, via target state | Qwen / LLaVA |
| MSD | ✓ | ✓ | ✓ | Method-specific | ✓ | Qwen / LLaVA |
| ViSpec | ✓ | ✓ | ✓ | ✓ | ✓ | Qwen / LLaVA |
| Lookahead | ✓ | ✗ | ✗ | ✗ | No explicit visual module | — |
| Token Recycling | ✓ | ✗ | ✗ | ✗ | No explicit visual module | — |
| PLD | ✓ | ✗ | ✗ | ✗ | No explicit visual module | — |
| SAM | Under exact verifier | No auxiliary checkpoint | No separate checkpoint | ✗ | Target-state-based | — |

**Table 2.** Medusa verification modes.

| Configuration | Distribution-preserving? |
| :--- | :---: |
| Medusa + exact rejection sampling | ✓ |
| Medusa + typical acceptance | ✗ |

**Table 3.** Deployment cost.

| Method | Extra resident VRAM | Checkpoint training data | Training compute | Max serving concurrency |
| :----- | :---: | :---: | :---: | :---: |
| EAGLE-1 | -- | -- | -- | -- |
| EAGLE-2 | -- | -- | -- | -- |
| EAGLE-3 | -- | -- | -- | -- |
| Medusa-exact | -- | -- | -- | -- |
| Medusa-typical | -- | -- | -- | -- |
| MSD | -- | -- | -- | -- |
| ViSpec | -- | -- | -- | -- |
| MSD + ViSkip | -- | -- | -- | -- |
| ViSpec + ViSkip | -- | -- | -- | -- |
| Lookahead | -- | -- | -- | -- |
| Token Recycling | -- | -- | -- | -- |
| PLD | -- | -- | -- | -- |
| SAM | -- | -- | -- | -- |
| SAM + ViSkip | -- | -- | -- | -- |

## Results

Each cell is **$\tau$ / speedup**. The AR baseline is 1× by definition, and $\tau$ was
measured overall only, not per topic.

**Table 4.** Qwen2.5-VL-7B.

| Method | GQA | TextVQA | Image Captioning | ChartQA | Complex Reasoning | Multi-Turn | Overall |
| :----- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| AR baseline | -- | -- | -- | -- | -- | -- | -- |
| **Training-based** | | | | | | | |
| EAGLE-1 | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| EAGLE-2 | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| EAGLE-3 | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| Medusa-exact | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| Medusa-typical | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| MSD | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| ViSpec | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| MSD + ViSkip | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| ViSpec + ViSkip | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| **Training-free** | | | | | | | |
| Lookahead | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| Token Recycling | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| PLD | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| SAM | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| SAM + ViSkip | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |

**Table 5.** LLaVA-1.5-7B — not run yet.

| Method | GQA | TextVQA | Image Captioning | ChartQA | Complex Reasoning | Multi-Turn | Overall |
| :----- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| AR baseline | -- | -- | -- | -- | -- | -- | -- |
| **Training-based** | | | | | | | |
| EAGLE-1 | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| EAGLE-2 | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| EAGLE-3 | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| Medusa-exact | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| Medusa-typical | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| MSD | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| ViSpec | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| MSD + ViSkip | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| ViSpec + ViSkip | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| **Training-free** | | | | | | | |
| Lookahead | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| Token Recycling | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| PLD | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| SAM | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |
| SAM + ViSkip | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- | -- / -- |

## TODO

- [ ] add [DFlash](https://arxiv.org/abs/2602.06036)
- [ ] add [Gagrani](https://arxiv.org/abs/2404.08856)
- [ ] add [SpecVLM](https://arxiv.org/abs/2509.11815)

## References

- [MMSpec](https://arxiv.org/abs/2603.14989) — Shen et al., 2026. Six task categories, ten
  methods, plus its own method ViSkip.
- [ViSpec](https://arxiv.org/abs/2509.15235) — Kang et al., NeurIPS 2025 ·
  [code](https://github.com/KangJialiang/ViSpec). Vision-aware drafter.
- [MSD](https://arxiv.org/abs/2505.14260) — Lin et al., 2025 ·
  [code](https://github.com/Lyn-Lucy/MSD). "Speculative Decoding Reimagined for MLLMs".
- [SpecVLM](https://arxiv.org/abs/2509.11815) — Huang et al., 2025 ·
  [code](https://github.com/haiduo/SpecVLM). Elastic visual compressor, online-logit
  distillation, ships EagleVLM. ⚠️ Not to be confused with
  [2508.16201](https://arxiv.org/abs/2508.16201), a different paper of the same name on
  video LLMs.
- [On Speculative Decoding for MLLMs](https://arxiv.org/abs/2404.08856) — Gagrani et al.,
  CVPR 2024 ELVM workshop. The language-only-drafter result.
- [DFlash](https://arxiv.org/abs/2602.06036) — Chen et al., ICML 2026 ·
  [code](https://github.com/z-lab/dflash). Block-diffusion drafter; attacks the fact that
  autoregressive drafting is itself sequential.
- [EAGLE-1](https://arxiv.org/abs/2401.15077) · [EAGLE-2](https://arxiv.org/abs/2406.16858)
  · [EAGLE-3](https://arxiv.org/abs/2503.01840) — Li et al. ·
  [code](https://github.com/SafeAILab/EAGLE)
- [Medusa](https://arxiv.org/abs/2401.10774) — Cai et al., 2024 ·
  [code](https://github.com/FasterDecoding/Medusa). Ships both exact rejection sampling
  and typical acceptance.
- [Lookahead Decoding](https://arxiv.org/abs/2402.02057) — Fu et al., 2024
- [Token Recycling](https://arxiv.org/abs/2408.08696) — Luo et al., 2024
- [SAM Decoding](https://arxiv.org/abs/2411.10666) — Hu et al., 2024
- **PLD** (prompt lookup decoding) — no arXiv paper; reference implementation at
  [apoorvumang/prompt-lookup-decoding](https://github.com/apoorvumang/prompt-lookup-decoding).

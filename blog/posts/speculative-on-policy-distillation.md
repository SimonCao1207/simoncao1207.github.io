[Speculative Knowledge Distillation](https://huggingface.co/papers/2410.11325) (SKD) splits the difference between supervised and on-policy KD. The student proposes tokens, the teacher checks each against its own top-$K$, and anything outside gets discarded and resampled from the teacher. Early in training the student is bad, most tokens get replaced, and it behaves like supervised KD; as the student improves the teacher steps back and it becomes on-policy KD. During training rollouts, a student token outside the teacher's top-$K$ is replaced by a sample from the teacher.

[Replay-OPD](https://arxiv.org/pdf/2607.26057v1)
## Baselines
- **SKD variants**:
    - *SKD-rKL*: reverse KL for all tokens, discarded rejected one. 
    - *OPD*: equivalent to SKD with $K=0$. 
    - *SKD-hybrid-KL*: forward KL where the teacher accepted the draft, reverse KL where it rejected one. 
    - *SKD-CE-rKL*: hard-label cross-entropy on the kept token (the teacher's resample where it rejected the draft) blended with reverse KL, $\alpha=0.5$. 
- **Replay-OPD**: starts from a normal student rollout, but when the teacher identifies a reflection point—a place where it would reconsider or redirect the reasoning—the teacher takes over and generates an alternative continuation from that point.

- The key difference is therefore what kind of teacher–student disagreement each method exploits:
    - SKD: generic disagreement over the next-token distribution—which token should come next?
    - Replay-OPD: structured, directional disagreement over the reasoning trajectory—the teacher wants to reflect or change course (e.g., “wait,” “but,” “however”), while the student would continue along its current path.

## Experiment setup

**Qwen3-8B** (teacher, thinking disabled) is distilled into **Qwen3-0.6B-Base** (student) on the Hendrycks MATH train split (7.5k problems). Evaluation runs every 25 steps on 100 fixed MATH500 problems with 8 samples each; tracking avg@8 and pass@8.


**Table 1.** **Training configuration.** Identical across arms; only the loss differs, as described above.

| Setting | Value |
| :------ | :---- |
| Temperature | 1.0 |
| Max generation length | 1024 tokens |
| Epochs | 1 |
| Steps | 234 |
| Prompts per step | 32 |
| Learning rate | 2e-5 |
| Precision | bf16 |

## Results

**Figure 1.** **SKD shortens rollouts but leaves accuracy unchanged.** Top left: the baseline hits the generation cap by step 25 and stays there; SKD never does, and keeps shortening. Top right: the teacher replaces around 11% of tokens throughout, for every variant. Bottom: the accuracy curves overlap, on avg@8 and pass@8 alike.

![Rollout length, teacher intervention rate, and MATH500 accuracy during training](img/skd-training.svg)

**Table 2.** **OPD vs. SKD variants** All values are percentages, 8 samples per problem. The micro-average pools all 1,547 problems; bold marks the best of all methods. 

| Method | MATH500 |  | AIME24 |  | AIME25 |  | AMC23 |  | Minerva |  | OlympiadBench |  | **Micro-avg** |  |
| :----- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
|  | avg@8 | pass@8 | avg@8 | pass@8 | avg@8 | pass@8 | avg@8 | pass@8 | avg@8 | pass@8 | avg@8 | pass@8 | avg@8 | pass@8 |
| Base | 11.7 | 50.2 | 0.4 | 3.3 | 0.0 | 0.0 | 3.8 | 22.5 | 3.8 | 19.1 | 3.9 | 19.9 | 6.3 | 28.9 |
| OPD | **49.7** | 71.0 | **2.9** | **10.0** | 0.4 | 3.3 | **24.4** | 45.0 | 13.7 | 28.3 | **16.2** | 33.3 | **26.3** | 43.9 |
| SKD-rKL (K=1) | 46.2 | 70.8 | 1.7 | 3.3 | **1.7** | **10.0** | 20.9 | **52.5** | 14.3 | 30.1 | 15.6 | 33.6 | 24.9 | 44.5 |
| SKD-hybrid-KL (K=1) | 45.7 | 69.8 | 2.1 | **10.0** | 0.4 | 3.3 | 22.2 | 50.0 | 12.5 | 30.9 | 14.4 | 34.1 | 23.9 | 44.4 |
| SKD-CE-rKL (K=1, α=0.5) | 47.5 | **72.0** | **2.9** | 6.7 | 0.4 | 3.3 | 22.8 | 50.0 | **14.8** | **31.6** | 16.0 | **34.8** | 25.6 | **45.5** |

**Table 3.** **Generation length at evaluation.** 

| Method | Mean length | Truncated |
| :----- | ----------: | --------: |
| Base | 1143 | 44.3% |
| OPD | 2043 | 99.5% |
| SKD-rKL (K=1) | 1425 | 50.5% |
| SKD-hybrid-KL (K=1) | 1704 | 71.7% |
| SKD-CE-rKL (K=1, α=0.5) | **1346** | **44.4%** |
import { useEffect, useState, type JSX } from 'react';
import { AGENT_NEWLINE, Button, DOC, PROCESS_DEMO, SubagentCard, SubagentGroup, Thinking, ThinkingBranches, TODO_STATUS, TodoTree, VARIANT, type TodoNode, type TodoStatus } from '@hx/ui';
import { Code, H2, P, Preview } from '../../components/DocKit';

const NL = AGENT_NEWLINE;
const { stepMs: STEP_MS, step: S } = PROCESS_DEMO;
const MAX_STEP = S.end;

const THOUGHT = ['**梳理 docs 结构**', '先看导航分组, 找出重复的页面.', '**比较精简方案**', '只删空页, 还是把同类页合并?', '**确定执行顺序**', '先合并, 再清理空导航.'];

const DEMO_CODE = [
  '<Thinking content={thought} status={thinking ? 1 : 0} startedAt={t0} endedAt={t1} />',
  '<ThinkingBranches branches={branches} chosenId={chosen} />',
  '<SubagentGroup>',
  '  <SubagentCard role=researcher task=... status=running startedAt={t2} summary=...>',
  '    <TodoTree title={null} items={steps} />',
  '  </SubagentCard>',
  '</SubagentGroup>',
  '<TodoTree items={plan} />',
].join(NL);

function useSteps(max: number) {
  const [step, setStep] = useState<number>(S.idle);
  const [t0, setT0] = useState(0);
  useEffect(() => {
    if (step < S.start || step >= max) {
      return undefined;
    }
    const id = window.setTimeout(() => setStep((value) => value + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [step, max]);
  return {
    step,
    at: (k: number) => t0 + k * STEP_MS,
    start: () => {
      setT0(Date.now());
      setStep(S.start);
    },
    reset: () => setStep(S.idle),
  };
}

/** 思考与过程页: 思考块, 发散思考, 子代理, 分层待办 串成一条实时流程. */
export function AgentProcessPage(): JSX.Element {
  const { step, at, start, reset } = useSteps(MAX_STEP);
  const leaf = (from: number, to: number): TodoStatus => (step < from ? TODO_STATUS.pending : step < to ? TODO_STATUS.running : TODO_STATUS.done);
  const thinkingDone = step >= S.branch;
  const thought = THOUGHT.slice(0, Math.max(0, Math.min(step + 1, THOUGHT.length))).join(NL);
  const plan: TodoNode[] = [
    {
      id: 'docs',
      title: '精简 docs',
      children: [
        { id: 'docs-scan', title: '盘点重复页', status: leaf(S.scan, S.scanEnd) },
        { id: 'docs-merge', title: '合并同类页', status: leaf(S.decide, S.merge), note: '正在比对两组加载指示' },
        { id: 'docs-nav', title: '清理空导航', status: leaf(S.merge, S.end) },
      ],
    },
    {
      id: 'process',
      title: '过程展示',
      children: [
        { id: 'process-think', title: '思考块', status: leaf(S.start, S.branch) },
        { id: 'process-agents', title: '子代理与发散', status: leaf(S.branch, S.edit) },
      ],
    },
  ];
  return (
    <>
      <P>
        让用户时刻知道 AI 在做什么: <Code>Thinking</Code> 在首个 token 到达前就出现并计时, <Code>ThinkingBranches</Code> 展示发散比较与收敛,
        <Code>SubagentGroup</Code> / <Code>SubagentCard</Code> 展示并行子代理, <Code>TodoTree</Code> 是分层实时待办. 四者共用一套状态图标与动效.
      </P>

      <H2>实时演示</H2>
      <P>点开始, 按 思考 → 发散 → 子代理 的顺序推进, 右侧待办同步更新. 完成的部分自动收起, 进行中的部分始终在视口里.</P>
      <Preview code={DEMO_CODE}>
        <div className={DOC.stackMd}>
          <div className='grid w-full gap-4 md:grid-cols-[1fr_240px]'>
            <div className='flex min-h-64 flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-3.5'>
              {step >= S.start && <Thinking content={thought} status={thinkingDone ? TODO_STATUS.done : TODO_STATUS.running} startedAt={at(S.start)} endedAt={thinkingDone ? at(S.branch) : undefined} />}
              {step >= S.branch && (
                <ThinkingBranches
                  chosenId={step >= S.decide ? 'pick-merge' : undefined}
                  branches={[
                    { id: 'pick-empty', label: '只删空页', note: '改动最小', reason: '重复页仍然在' },
                    { id: 'pick-merge', label: '合并同类页', note: '导航明显变短', reason: '一次解决重复与空页' },
                    { id: 'pick-rewrite', label: '整站重写', note: '成本高', reason: '超出这次范围' },
                  ]}
                />
              )}
              {step >= S.decide && (
                <SubagentGroup>
                  <SubagentCard role='researcher' task='比对重复页' status={step < S.research ? TODO_STATUS.running : TODO_STATUS.done} startedAt={at(S.decide)} endedAt={step >= S.research ? at(S.research) : undefined} summary='找到可合并的页面组'>
                    <TodoTree
                      title={null}
                      items={[
                        { id: 'read-nav', title: '读取 nav.ts', status: leaf(S.decide, S.read) },
                        { id: 'read-diff', title: '逐页比对', status: leaf(S.read, S.research) },
                      ]}
                    />
                  </SubagentCard>
                  <SubagentCard role='editor' task='改写导航分组' status={step < S.edit ? TODO_STATUS.running : TODO_STATUS.done} startedAt={at(S.decide)} endedAt={step >= S.edit ? at(S.edit) : undefined} summary='导航条目已更新'>
                    <TodoTree
                      title={null}
                      items={[
                        { id: 'edit-items', title: '合并条目', status: leaf(S.read, S.merge) },
                        { id: 'edit-order', title: '更新分组顺序', status: leaf(S.merge, S.edit) },
                      ]}
                    />
                  </SubagentCard>
                </SubagentGroup>
              )}
              {step < S.start && <P>点开始查看演示.</P>}
            </div>
            <div className='rounded-xl border border-border/60 bg-card/40 p-3'>
              <TodoTree items={plan} />
            </div>
          </div>
          <div className={DOC.wrap}>
            <Button size={VARIANT.sm} variant={VARIANT.primary} onClick={start}>
              开始
            </Button>
            <Button size={VARIANT.sm} variant={VARIANT.ghost} onClick={reset}>
              重置
            </Button>
          </div>
        </div>
      </Preview>

      <H2>设计要点</H2>
      <P>状态先于内容: 进行中的部分带扫光与计时, 完成后收成一行摘要, 用户点开才看细节.</P>
      <P>层级用缩进与 1px 连接线表达, 父级状态由子级推导, 不需要调用方手算.</P>
      <P>系统要求减弱动效时所有动画停用, 状态仍靠图标与文字可读.</P>
    </>
  );
}

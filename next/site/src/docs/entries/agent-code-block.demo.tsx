import { CodeBlock, type CodeTheme } from "@/agent";
import type { DemoProps } from "../types";

const CODE = `#include <bits/stdc++.h>
using namespace std;

// 单调栈: 每个元素右边第一个比它大的下标
vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> ans(n, -1);
    stack<int> st;
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && a[st.top()] < a[i]) {
            ans[st.top()] = i;
            st.pop();
        }
        st.push(i);
    }
    return ans;
}

int main() {
    vector<int> a{2, 1, 2, 4, 3};
    for (int x : nextGreater(a)) cout << x << ' ';
    return 0;
}`;

export default function AgentCodeBlockDemo({ values }: DemoProps) {
  return (
    <div className="w-full max-w-2xl px-4">
      <CodeBlock
        code={CODE}
        language="C++"
        title={values.title ? "next_greater.cpp" : undefined}
        theme={values.theme as CodeTheme}
        lineNumbers={Boolean(values.lineNumbers)}
        wrap={Boolean(values.wrap)}
        collapse={Number(values.collapse)}
        highlightLines={values.highlight ? [10, 11, 12, 13] : undefined}
      />
    </div>
  );
}

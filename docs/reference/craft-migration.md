# 迁移

Select, Dialog, Drawer, Tooltip, Accordion, DatePicker, Slider, Toast, Table 仍从 `@hx/ui` 的原名字导出. 进出场改成可中断弹簧, 不再并排提供 Craft* 组件.

调用方不用改组件名. 对话框和选择的子组件 (DialogContent, SelectTrigger) 还在. 折叠内容的高度不再依赖 `hx-collapse-down` 关键帧.

如果有样式盖过 `transform`, 弹簧位移会被盖掉. 把位移留给内容包裹层.

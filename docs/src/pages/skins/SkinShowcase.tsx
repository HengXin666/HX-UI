import { useState, type JSX } from "react";
import { Badge, Button, Card, Input, Progress, Switch } from "@hx/ui";
import { SKINS_DOC, SKINS_DOC_SWATCHES } from "../../../../src/constants/skins";

const DEMO_PROGRESS = 64;

/**
 * 皮肤演示面: 一组代表性组件 (按钮, 输入, 开关, 徽标, 进度, 卡片) 与皮肤专属令牌
 * (display 字体, hero 渐变, 品牌渐变, 光晕阴影, 语义色块). 全部只用现有组件与语义类名,
 * 换皮肤 / 换密度时外观变化完全来自令牌.
 */
export function SkinShowcase({ skin, density }: { skin: string; density: string }): JSX.Element {
  const [notify, setNotify] = useState(true);

  return (
    <div className={SKINS_DOC.stage}>
      <div className={SKINS_DOC.hero}>
        <span className={SKINS_DOC.meta}>
          data-skin={skin} · data-density={density}
        </span>
        <h3 className={SKINS_DOC.heroTitle}>同一套组件, 六种气质</h3>
        <p className={SKINS_DOC.tileText}>
          标题用 --font-display, 背景是 --gradient-hero, 光晕强度随 --effect-intensity 缩放.
        </p>
        <div className={SKINS_DOC.row}>
          <Button variant="primary" size="lg">开始使用</Button>
          <Button size="lg">查看文档</Button>
          <Button variant="link">了解定价</Button>
        </div>
      </div>

      <Card variant="solid" className={SKINS_DOC.tile}>
        <span className={SKINS_DOC.tileTitle}>账户设置</span>
        <Input placeholder="name@example.com" />
        <div className={SKINS_DOC.row}>
          <Switch checked={notify} onCheckedChange={setNotify} />
          <span className={SKINS_DOC.tileText}>接收产品更新邮件</span>
        </div>
        <div className={SKINS_DOC.row}>
          <Button variant="primary">保存</Button>
          <Button variant="ghost">取消</Button>
        </div>
      </Card>

      <Card variant="solid" className={SKINS_DOC.tile}>
        <span className={SKINS_DOC.tileTitle}>部署状态</span>
        <div className={SKINS_DOC.row}>
          <Badge>生产</Badge>
          <Badge variant="success">运行中</Badge>
          <Badge variant="warning">待审</Badge>
          <Badge variant="outline">v2.4.1</Badge>
        </div>
        <Progress value={DEMO_PROGRESS} />
        <span className={SKINS_DOC.tileText}>构建进度 {DEMO_PROGRESS}%</span>
      </Card>

      <div className={SKINS_DOC.glowTile}>
        <span className={SKINS_DOC.tileTitle}>强调卡 (shadow-glow)</span>
        <div className={SKINS_DOC.brandBar} />
        <span className={SKINS_DOC.tileText}>品牌渐变条: --gradient-brand = primary 到 accent-2.</span>
      </div>

      <div className={SKINS_DOC.tile}>
        <span className={SKINS_DOC.tileTitle}>语义色块</span>
        <div className={SKINS_DOC.swatches}>
          {SKINS_DOC_SWATCHES.map((cls) => (
            <div key={cls} title={cls} className={`${SKINS_DOC.swatch} ${cls}`} />
          ))}
        </div>
        <span className={SKINS_DOC.tileText}>background · card · muted · primary · accent-2 · heading</span>
      </div>
    </div>
  );
}

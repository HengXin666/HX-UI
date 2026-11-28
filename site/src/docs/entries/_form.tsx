/** 表单类演示共用的卡片外壳 */
export function FormCard({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-sm rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur ${className}`}>
      {title && <p className="mb-4 font-medium">{title}</p>}
      {children}
    </div>
  );
}
